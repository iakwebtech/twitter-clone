<?php

namespace App\Http\Controllers;

use App\Http\Resources\UserResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class NotificationController extends Controller
{
    public function index(Request $request): Response|JsonResponse
    {
        $user = $request->user();
        $notifications = $user->notifications()->latest()->paginate(30);

        $pendingRequests = $user->receivedFollowRequests()
            ->with('sender.profile')
            ->where('status', 'pending')
            ->latest()
            ->get()
            ->map(fn ($req) => [
                'id' => $req->id,
                'created_at' => $req->created_at?->diffForHumans(),
                'sender' => (new UserResource($req->sender))->resolve($request),
            ]);

        if ($request->wantsJson() && ! $request->header('X-Inertia')) {
            return response()->json([
                'notifications' => $notifications->items(),
                'unread_count' => $user->unreadNotifications()->count(),
                'pending_requests' => $pendingRequests,
            ]);
        }

        return Inertia::render('Notifications/Index', [
            'notifications' => $notifications->items(),
            'pendingRequests' => $pendingRequests,
        ]);
    }

    public function markAsRead(Request $request, string $id): JsonResponse|RedirectResponse
    {
        $notification = $request->user()->notifications()->where('id', $id)->firstOrFail();
        $notification->markAsRead();

        if ($request->wantsJson() && ! $request->header('X-Inertia')) {
            return response()->json(['read' => true]);
        }

        return back();
    }

    public function markAllAsRead(Request $request): JsonResponse|RedirectResponse
    {
        $request->user()->unreadNotifications()->update(['read_at' => now()]);

        if ($request->wantsJson() && ! $request->header('X-Inertia')) {
            return response()->json(['read_all' => true]);
        }

        return back()->with('success', 'All notifications marked as read.');
    }

    public function destroy(Request $request, string $id): JsonResponse|RedirectResponse
    {
        $request->user()->notifications()->where('id', $id)->delete();

        if ($request->wantsJson() && ! $request->header('X-Inertia')) {
            return response()->json(['deleted' => true]);
        }

        return back();
    }
}
