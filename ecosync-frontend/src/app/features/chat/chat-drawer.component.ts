import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormField } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatIcon } from '@angular/material/icon';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { ChatService, Message } from '../../core/services/chat.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-chat-drawer',
  standalone: true,
  imports: [ CommonModule, FormsModule, MatFormField, MatInput, MatIcon, MatIconButton, MatButton, MatTooltip ],
  templateUrl: './chat-drawer.component.html',
  styleUrls: ['./chat-drawer.component.scss']
})
export class ChatDrawerComponent implements OnInit, OnDestroy {
  @Input() friend!: { id: number; email: string };
  @Output() close = new EventEmitter<void>();
  @ViewChild('scrollMe') scrollMe?: ElementRef;

  messages: Message[] = [];
  message = '';
  myId = 0;
  pollInterval: any;
  lastNotifiedMessageId = 0;
  acceptTypes = '.png,.jpeg,.jpg,.gif,.csv,.xlsx';
  selectedFile: File | null = null;
  selectedFilePreviewUrl: string | null = null;

  // Aperçu modale
  previewUrl: SafeResourceUrl | null = null;
  previewType: 'image' | 'file' = 'image';
  previewFileName: string | null = null;

  constructor(private chatService: ChatService, private sanitizer: DomSanitizer) {}

  ngOnInit() {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        this.myId = payload.id;
      } catch {
        this.myId = 0;
      }
    }
    this.loadMessages(true); // Premier load = pas de notif
    this.pollInterval = setInterval(() => this.loadMessages(), 3000);
  }

  ngOnDestroy() {
    clearInterval(this.pollInterval);
  }

  loadMessages(isFirstLoad = false) {
    if (!this.friend?.id) return;
    this.chatService.getMessages(this.friend.id).subscribe(msgs => {
      if (!msgs.length) return;

      const lastMsg = msgs[msgs.length - 1];
      if (isFirstLoad) {
        this.lastNotifiedMessageId = lastMsg.id ?? 0;
      } else {
        if (
          lastMsg &&
          lastMsg.id !== this.lastNotifiedMessageId &&
          lastMsg.senderId !== this.myId
        ) {
          this.playSound();
          this.lastNotifiedMessageId = lastMsg.id;
        }
      }
      this.messages = msgs;
      setTimeout(() => this.scrollToBottom(), 100);
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.selectedFile = input.files[0];
      // Si image, générer un preview DataURL
      if (this.selectedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => this.selectedFilePreviewUrl = e.target?.result as string;
        reader.readAsDataURL(this.selectedFile);
      } else {
        this.selectedFilePreviewUrl = null;
      }
    }
  }

  clearSelectedFile() {
    this.selectedFile = null;
    this.selectedFilePreviewUrl = null;
  }

  sendMessage() {
    if ((!this.message.trim() && !this.selectedFile) || !this.friend?.id) return;

    if (this.selectedFile) {
      const formData = new FormData();
      formData.append('file', this.selectedFile);
      this.chatService.uploadFile(formData).subscribe(res => {
        this.chatService.sendMessage(this.friend.id, this.message.trim(), res.fileUrl, res.fileType)
            .subscribe(() => {
              this.message = '';
              this.selectedFile = null;
              this.selectedFilePreviewUrl = null;
              this.loadMessages();
            });
      });
    } else {
      this.chatService.sendMessage(this.friend.id, this.message.trim()).subscribe(() => {
        this.message = '';
        this.loadMessages();
      });
    }
  }

  scrollToBottom() {
    try {
      this.scrollMe!.nativeElement.scrollTop = this.scrollMe!.nativeElement.scrollHeight;
    } catch {}
  }

  playSound() {
    const audio = new Audio('/assets/notification.mp3');
    audio.play().catch(() => {});
  }

  getFullFileUrl(msg: Message): string {
    if (!msg.fileUrl) return '';
    if (msg.fileUrl.startsWith('http')) return msg.fileUrl;
    return 'http://localhost:3000' + msg.fileUrl;
  }

  // Aperçu image ou fichier
  openImagePreview(msg: Message) {
    const url = this.getFullFileUrl(msg);
    this.previewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
    this.previewType = 'image';
    this.previewFileName = this.extractFileName(url);
  }
  openFilePreview(msg: Message) {
    const url = this.getFullFileUrl(msg);
    this.previewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
    this.previewType = 'file';
    this.previewFileName = this.extractFileName(url);
  }
  closeImagePreview() {
    this.previewUrl = null;
    this.previewType = 'image';
    this.previewFileName = null;
  }
  extractFileName(url: string): string {
    try {
      return decodeURIComponent(url.split('/').pop() ?? 'fichier');
    } catch {
      return 'fichier';
    }
  }
  downloadPreviewedImage() {
    if (this.previewUrl) {
      const a = document.createElement('a');
      // @ts-ignore
      a.href = this.previewUrl.changingThisBreaksApplicationSecurity || this.previewUrl;
      a.download = this.previewFileName || 'fichier';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  }

}
