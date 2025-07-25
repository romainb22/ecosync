import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ChatService } from '../../../core/services/chat.service';
import { FriendsService } from '../../../core/services/friends.service';
import { MessagesService } from '../../../core/services/messages.service';
import { ChatDrawerComponent } from '../../chat/chat-drawer.component';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButton,
    ChatDrawerComponent,
    MatSidenavModule
  ],
  templateUrl: './dashboard-layout.html',
  styleUrls: ['./dashboard-layout.css']
})
export class DashboardLayoutComponent implements OnInit, OnDestroy {
  pendingRequestsCount = 0;
  unreadMessagesCount = 0;
  chatOpened = false;
  selectedFriend: { id: number; email: string } | null = null;
  friendsList: { id: number; email: string }[] = [];
  lastNotifiedMessageId = 0;
  pollInterval: any;
  myId = 0;

  constructor(
    private auth: AuthService,
    private friendsService: FriendsService,
    private router: Router,
    private messagesService: MessagesService,
    private chatService: ChatService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.initMyId();
    this.syncLastNotifiedMessageIdWithLastReceived();
    this.subscribeToUnreadCount();
    this.messagesService.pollUnreadCount(); // Unique appel, safe grâce à la protection

    this.auth.user$.subscribe(isLoggedIn => {
      if (isLoggedIn) {
        this.friendsService.refreshPendingRequestsCount();
        this.loadFriends();
        this.initMyId();
      } else {
        this.friendsService.pendingRequestsCount$.next(0);
        this.friendsList = [];
        this.unreadMessagesCount = 0;
      }
    });

    if (this.auth.isAuthenticated()) {
      this.friendsService.refreshPendingRequestsCount();
      this.loadFriends();
    }

    this.pollInterval = setInterval(() => {
      if (this.auth.isAuthenticated()) {
        this.checkForNewMessages();
      }
    }, 3000);
  }

  ngOnDestroy() {
    if (this.pollInterval) clearInterval(this.pollInterval);
  }

  initMyId() {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        this.myId = payload.id;
      } catch {
        this.myId = 0;
      }
    }
  }

  checkForNewMessages() {
    this.chatService.getLastMessages().subscribe(messages => {
      if (!messages.length) return;
      const last = messages[0];
      if (
        last.id !== this.lastNotifiedMessageId &&
        last.senderId !== this.myId &&
        !this.chatOpened
      ) {
        this.playSound();
        this.lastNotifiedMessageId = last.id;
        this.showMessageNotification(last);
      }
    });
  }

  showMessageNotification(message: any) {
    const snack = this.snackBar.open(
      `De: ${message.senderEmail} - "${message.content.slice(0, 64)}"`,
      'Voir',
      { duration: 5000 }
    );
    snack.onAction().subscribe(() => {
      this.openChat({ id: message.senderId, email: message.senderEmail });
      this.messagesService.markMessagesAsRead(message.senderId).subscribe();
      setTimeout(() => this.cdr.detectChanges(), 10);
    });
  }

  playSound() {
    const audio = new Audio('/assets/notification.mp3');
    audio.play().catch(() => {});
  }

  subscribeToUnreadCount() {
    this.messagesService.unreadCount$.subscribe(count => {
      this.unreadMessagesCount = count;
    });
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate([ '/login' ]);
  }

  openChat(friend: { id: number; email: string }) {
    this.selectedFriend = { ...friend };
    this.chatOpened = true;
    this.messagesService.markMessagesAsRead(friend.id).subscribe();
    this.syncLastNotifiedMessageIdWithLastReceived();
  }

  closeChat() {
    this.chatOpened = false;
    this.selectedFriend = null;
    this.syncLastNotifiedMessageIdWithLastReceived();
  }

  loadFriends() {
    this.friendsService.getFriendsList().subscribe(list => {
      this.friendsList = list;
    });
  }

  private syncLastNotifiedMessageIdWithLastReceived() {
    this.chatService.getLastMessages().subscribe(messages => {
      if (messages.length) {
        this.lastNotifiedMessageId = messages[0].id;
      }
    });
  }
}
