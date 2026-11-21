<?php

namespace App\Services;

use App\Events\MessageSent;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\MessageAttachment;
use App\Models\User;
use App\Notifications\SocialNotification;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;

class MessagingService
{
    public function findOrCreateDirectConversation(User $sender, User $recipient): Conversation
    {
        $existing = Conversation::query()
            ->where('type', 'direct')
            ->whereHas('participants', fn ($q) => $q->where('users.id', $sender->id))
            ->whereHas('participants', fn ($q) => $q->where('users.id', $recipient->id))
            ->first();

        if ($existing) {
            return $existing;
        }

        return DB::transaction(function () use ($sender, $recipient) {
            $conversation = Conversation::create([
                'type' => 'direct',
                'created_by' => $sender->id,
                'last_message_at' => now(),
            ]);

            $conversation->participants()->attach([
                $sender->id => ['role' => 'member', 'last_read_at' => now()],
                $recipient->id => ['role' => 'member', 'last_read_at' => null],
            ]);

            return $conversation;
        });
    }

    public function createGroupConversation(User $creator, string $name, array $memberIds): Conversation
    {
        return DB::transaction(function () use ($creator, $name, $memberIds) {
            $conversation = Conversation::create([
                'type' => 'group',
                'name' => $name,
                'created_by' => $creator->id,
                'last_message_at' => now(),
            ]);

            $participants = [$creator->id => ['role' => 'admin', 'last_read_at' => now()]];
            foreach (array_unique($memberIds) as $id) {
                if ((int) $id !== $creator->id) {
                    $participants[(int) $id] = ['role' => 'member', 'last_read_at' => null];
                }
            }

            $conversation->participants()->attach($participants);

            return $conversation;
        });
    }

    public function sendMessage(Conversation $conversation, User $sender, ?string $body, ?int $replyToId = null, array $files = []): Message
    {
        return DB::transaction(function () use ($conversation, $sender, $body, $replyToId, $files) {
            $message = Message::create([
                'conversation_id' => $conversation->id,
                'sender_id' => $sender->id,
                'reply_to_id' => $replyToId,
                'body' => $body,
            ]);

            foreach ($files as $file) {
                if (! $file instanceof UploadedFile) {
                    continue;
                }

                $mime = $file->getMimeType() ?? 'application/octet-stream';
                $type = str_starts_with($mime, 'image/') ? 'image' : (str_starts_with($mime, 'video/') ? 'video' : 'file');
                $path = $file->store('messages/'.$conversation->id, 'public');

                MessageAttachment::create([
                    'message_id' => $message->id,
                    'file_path' => $path,
                    'file_name' => $file->getClientOriginalName(),
                    'mime_type' => $mime,
                    'file_size' => $file->getSize(),
                    'type' => $type,
                ]);
            }

            $conversation->update(['last_message_at' => now()]);
            $conversation->participants()->updateExistingPivot($sender->id, ['last_read_at' => now()]);

            broadcast(new MessageSent($message))->toOthers();

            $recipients = $conversation->participants()->where('users.id', '!=', $sender->id)->get();
            foreach ($recipients as $recipient) {
                $recipient->notify(new SocialNotification(
                    'message',
                    $sender,
                    "{$sender->name} sent you a message",
                    ['conversation_id' => $conversation->id, 'message_id' => $message->id]
                ));
            }

            return $message->load(['sender.profile', 'attachments', 'replyTo.sender']);
        });
    }
}
