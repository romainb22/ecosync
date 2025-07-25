import { animate, style, transition, trigger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatFormField, MatInput, MatLabel } from '@angular/material/input';
import { MatList, MatListItem } from '@angular/material/list';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltip } from '@angular/material/tooltip';
import { debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs/operators';
import { FriendsService } from '../../../core/services/friends.service';

@Component({
  selector: 'app-dashboard-add-friends',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    MatFormField,
    MatLabel,
    MatProgressSpinner,
    MatList,
    MatListItem,
    MatIcon,
    MatIconButton,
    MatTooltip,
    MatInput
  ],
  templateUrl: './dashboard-add-friends.html',
  styleUrls: [ './dashboard-add-friends.css' ],
  animations: [
    trigger('fadeInList', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'none' }))
      ])
    ])
  ]
})
export class DashboardAddFriendsComponent {
  searchControl = new FormControl('');
  suggestions: { id: number; email: string; sent?: boolean }[] = [];
  loading = false;
  sendingRequestId: number | null = null;
  friendRequests: { id: number; sender: { id: number; email: string } }[] = [];

  constructor(
    private friendsService: FriendsService,
    private snackBar: MatSnackBar
  ) {
    this.searchControl.valueChanges
        .pipe(
          debounceTime(200), // 200ms pour plus de réactivité
          distinctUntilChanged(),
          tap(() => this.loading = true),
          switchMap(value => {
            // Ne pas trim ni filtrer trop fort, sauf si tu veux min. 2/3 caractères
            if (!value || value.length < 1) {
              this.suggestions = [];
              this.loading = false;
              return []; // observable vide
            }
            return this.friendsService.searchUsers(value);
          })
        )
        .subscribe({
          next: (results) => {
            this.suggestions = results.map(u => ({ ...u, sent: false }));
            this.loading = false;
          },
          error: (err) => {
            this.suggestions = [];
            this.loading = false;
          }
        });
    this.refreshFriendRequests();
  }

  sendRequest(receiverId: number) {
    this.sendingRequestId = receiverId;
    this.friendsService.sendFriendRequest(receiverId).subscribe({
      next: () => {
        this.suggestions = this.suggestions.map(u =>
          u.id === receiverId ? { ...u, sent: true } : u
        );
        this.sendingRequestId = null;
        this.snackBar.open('Demande envoyée !', 'Fermer', { duration: 1800 });

        this.searchControl.setValue('');
      },
      error: (err) => {
        this.sendingRequestId = null;
        this.snackBar.open(
          err?.error?.error || 'Erreur lors de l\'envoi',
          'Fermer',
          { duration: 2000 }
        );
      }
    });
  }

  refreshFriendRequests() {
    this.friendsService.getFriendRequests().subscribe({
      next: (reqs) => this.friendRequests = reqs,
      error: () => this.friendRequests = []
    });
  }

  acceptRequest(requestId: number) {
    this.friendsService.acceptFriendRequest(requestId).subscribe({
      next: () => {
        this.friendRequests = this.friendRequests.filter(r => r.id !== requestId);
        this.snackBar.open('Ami accepté !', 'Fermer', { duration: 2000 });
        this.refreshFriendRequests();
        this.friendsService.refreshPendingRequestsCount();
      },
      error: () => this.snackBar.open('Erreur lors de l\'acceptation', 'Fermer', { duration: 2000 })
    });

  }

  rejectRequest(requestId: number) {
    this.friendsService.rejectFriendRequest(requestId).subscribe({
      next: () => {
        this.friendRequests = this.friendRequests.filter(r => r.id !== requestId);
        this.snackBar.open('Demande refusée.', 'Fermer', { duration: 2000 });
        this.refreshFriendRequests();
        this.friendsService.refreshPendingRequestsCount();
      },
      error: () => this.snackBar.open('Erreur lors du refus', 'Fermer', { duration: 2000 })
    });
  }

  getAvatarColor(email: string): string {
    // Palette de couleurs Material-friendly
    const colors = [
      '#1976d2', '#7c4dff', '#ff8a65', '#43a047', '#ffb300',
      '#00bcd4', '#e53935', '#8d6e63', '#64b5f6', '#81c784'
    ];
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
      hash = email.charCodeAt(i) + ((hash << 5) - hash);
    }
    const idx = Math.abs(hash) % colors.length;
    return colors[ idx ];
  }

}
