import { HubConnection } from "@microsoft/signalr";
import { HubConnectionBuilder } from "@microsoft/signalr/dist/esm/HubConnectionBuilder";
import { LogLevel } from "@microsoft/signalr/dist/esm/ILogger";
import { makeAutoObservable, runInAction } from "mobx";
import { ChatComment } from "../models/ChatComment";
import { store } from "./store";

export default class CommentStore {
  comments: ChatComment[] = [];
  hubConnection: HubConnection | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  createhubConnection = (activityId: string) => {
    if (store.activityStore.selectedActivity) {
      this.hubConnection = new HubConnectionBuilder()
        .withUrl("http://localhost:5000/chat?activityId=" + activityId, {
          accessTokenFactory: () => store.userStore.user?.token!,
        })
        .withAutomaticReconnect()
        .configureLogging(LogLevel.Information)
        .build();

      this.hubConnection
        .start()
        .catch((error) =>
          console.log("Error establishing the connection: ", error)
        );

      // Argument ("LoaComments") value must be the same added in API/SignalR/ChatHub.cs file, method OnConnectedAsync()
      this.hubConnection.on("LoadComments", (comments: ChatComment[]) => {
        runInAction(() => {
          comments.forEach((comment) => {
            comment.createdAt = new Date(comment.createdAt + "Z");
          });
          this.comments = comments;
        });
      });

      // Argument ("RecieveComment") value must be the same added in API/SignalR/ChatHub.cs file, method SendComment()
      this.hubConnection.on("RecieveComment", (comment: ChatComment) => {
        runInAction(() => {
          comment.createdAt = new Date(comment.createdAt);
          // unshift put the comment in the beginning of the array
          this.comments.unshift(comment);
        });
      });
    }
  };

  stopHubConnection = () => {
    this.hubConnection
      ?.stop()
      .catch((error) => console.log("ErrorStopping connection: ", error));
  };

  clearComments = () => {
    this.comments = [];
    this.stopHubConnection();
  };

  addComment = async (values: any) => {
    values.activityId = store.activityStore.selectedActivity?.id;

    try {
      // invoke argument must match the name of method SendComment() in ChatHub.cs file
      await this.hubConnection?.invoke("SendComment", values);
    } catch (error) {
      console.log(error);
    }
  };
}
