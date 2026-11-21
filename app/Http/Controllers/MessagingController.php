<?php

namespace App\Http\Controllers;

use App\Events\UserTyping;
use App\Http\Requests\Messaging\SendMessageRequest;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use App\Services\MessagingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class MessagingController extends Controller
{
    public function __construct(private MessagingService $messagingService) {}

    public function index(Request $request, ?Conversation $conversation = null): Response
    {
        $user = $request->user();

        $conversations = $user->conversations()
            ->with(['participants.profile', 'latestMessage.sender'])
            ->orderByDesc('last_message_at')
            ->get()
            ->map(function (Conversation $conv) use ($user) {
                $other = $conv->type === 'direct'
                    ? $conv->participants->firstWhere('id', '!=', $user->id)
                    : null;

                $pivot = $conv->participants->firstWhere('id', $user->id)?->pivot;
                $unreadCount = $conv->messages()
                    ->where('sender_id', '!=', $user->id)
                    ->when($pivot?->last_read_at, fn ($q) => $q->where('created_at', '>', $pivot->last_read_at))
                    ->count();

                return [
                    'id' => $conv->id,
                    'type' => $conv->type,
                    'name' => $conv->type === 'group' ? $conv->name : ($other?->name ?? 'Direct Message'),
                    'username' => $other?->username,
                    'avatar_url' => $other?->profile?->avatar_url,
                    'is_online' => $other?->isOnline() ?? false,
                    'last_message_at' => $conv->last_message_at?->diffForHumans(),
                    'latest_message' => $conv->latestMessage?->body ?? ($conv->latestMessage ? 'Sent an attachment' : null),
                    'unread_count' => $unreadCount,
                    'participants_count' => $conv->participants->count(),
                ];
            });

        $activeConversation = null;
        $messages = [];

        if ($conversation) {
            Gate::authorize('view', $conversation);
            $conversation->participants()->updateExistingPivot($user->id, ['last_read_at' => now()]);
            $conversation->load(['participants.profile']);

            $other = $conversation->type === 'direct'
                ? $conversation->participants->firstWhere('id', '!=', $user->id)
                : null;

            $activeConversation = [
                'id' => $conversation->id,
                'type' => $conversation->type,
                'name' => $conversation->type === 'group' ? $conversation->name : ($other?->name ?? 'Conversation'),
                'username' => $other?->username,
                'avatar_url' => $other?->profile?->avatar_url,
                'is_online' => $other?->isOnline() ?? false,
                'participants' => $conversation->participants->map(fn ($p) => [
                    'id' => $p->id,
                    'name' => $p->name,
                    'username' => $p->username,
                    'avatar_url' => $p->profile?->avatar_url,
                    'last_read_at' => $p->pivot->last_read_at,
                ]),
            ];

            $messages = $conversation->messages()
                ->with(['sender.profile', 'attachments', 'replyTo.sender'])
                ->orderBy('created_at')
                ->limit(100)
                ->get()
                ->map(fn (Message $m) => $this->formatMessage($m));
        }

        return Inertia::render('Messages/Index', [
            'conversations' => $conversations,
            'activeConversation' => $activeConversation,
            'messages' => $messages,
        ]);
    }

    public function startDirect(Request $request, User $user): RedirectResponse
    {
        Gate::authorize('message', $user);
        $conversation = $this->messagingService->findOrCreateDirectConversation($request->user(), $user);

        return redirect()->route('messages.show', $conversation->id);
    }

    public function createGroup(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'member_ids' => ['required', 'array', 'min:1'],
            'member_ids.*' => ['integer', 'exists:users,id'],
        ]);

        $conversation = $this->messagingService->createGroupConversation(
            $request->user(),
            $validated['name'],
            $validated['member_ids']
        );

        return redirect()->route('messages.show', $conversation->id);
    }

    public function sendMessage(SendMessageRequest $request, Conversation $conversation): JsonResponse
    {
        Gate::authorize('sendMessage', $conversation);

        $files = $request->file('attachments', []);
        $message = $this->messagingService->sendMessage(
            $conversation,
            $request->user(),
            $request->input('body'),
            $request->input('reply_to_id'),
            is_array($files) ? $files : []
        );

        return response()->json(['message' => $this->formatMessage($message)], 201);
    }

    public function typing(Request $request, Conversation $conversation): JsonResponse
    {
        Gate::authorize('view', $conversation);
        $user = $request->user();

        broadcast(new UserTyping(
            $conversation->id,
            $user->id,
            $user->username,
            $request->boolean('is_typing', true)
        ))->toOthers();

        return response()->json(['ok' => true]);
    }

    public function destroyMessage(Request $request, Message $message): JsonResponse
    {
        abort_unless($message->sender_id === $request->user()->id, 403);
        $message->delete();

        return response()->json(['deleted' => true]);
    }

    public function searchMessages(Request $request, Conversation $conversation): JsonResponse
    {
        Gate::authorize('view', $conversation);
        $q = trim((string) $request->query('q', ''));

        $results = $conversation->messages()
            ->with(['sender.profile', 'attachments'])
            ->where('body', 'like', "%{$q}%")
            ->latest()
            ->limit(25)
            ->get()
            ->map(fn (Message $m) => $this->formatMessage($m));

        return response()->json(['messages' => $results]);
    }

    private function formatMessage(Message $m): array
    {
        return [
            'id' => $m->id,
            'conversation_id' => $m->conversation_id,
            'sender_id' => $m->sender_id,
            'body' => $m->body,
            'created_at' => $m->created_at?->toISOString(),
            'created_human' => $m->created_at?->format('g:i A'),
            'sender' => [
                'id' => $m->sender->id,
                'name' => $m->sender->name,
                'username' => $m->sender->username,
                'avatar_url' => $m->sender->profile?->avatar_url,
            ],
            'attachments' => $m->attachments->map(fn ($a) => [
                'id' => $a->id,
                'type' => $a->type,
                'file_name' => $a->file_name,
                'url' => $a->url,
            ]),
            'reply_to' => $m->replyTo ? [
                'id' => $m->replyTo->id,
                'body' => $m->replyTo->body,
                'sender_name' => $m->replyTo->sender?->name,
            ] : null,
        ];
    }
}
