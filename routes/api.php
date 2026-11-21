<?php

use App\Http\Controllers\BookmarkController;
use App\Http\Controllers\ExploreController;
use App\Http\Controllers\FeedController;
use App\Http\Controllers\MessagingController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PostController;
use App\Http\Controllers\ProfileController;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    // Public API Auth Token Issuance
    Route::post('/auth/token', function (Request $request) {
        $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
            'device_name' => ['nullable', 'string'],
        ]);

        $user = User::where('email', $request->email)->first();
        if (! $user || ! Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Invalid credentials.'], 401);
        }

        $token = $user->createToken($request->input('device_name', 'api-client'))->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => (new UserResource($user->load('profile')))->resolve($request),
        ]);
    })->middleware('throttle:10,1');

    // Public Read Endpoints
    Route::get('/feed', [FeedController::class, 'index']);
    Route::get('/trending', [ExploreController::class, 'suggestions']);
    Route::get('/users/{username}', function (Request $request, string $username) {
        $user = User::with('profile')->where('username', strtolower($username))->firstOrFail();

        return new UserResource($user);
    });

    // Protected API Endpoints
    Route::middleware(['auth:sanctum', 'throttle:60,1'])->group(function () {
        Route::get('/me', fn (Request $request) => new UserResource($request->user()->load('profile')));
        Route::post('/posts', [PostController::class, 'store']);
        Route::patch('/posts/{post}', [PostController::class, 'update']);
        Route::delete('/posts/{post}', [PostController::class, 'destroy']);
        Route::post('/posts/{post}/like', [PostController::class, 'like']);
        Route::post('/posts/{post}/repost', [PostController::class, 'repost']);
        Route::post('/posts/{post}/bookmark', [PostController::class, 'bookmark']);
        Route::post('/posts/{post}/vote', [PostController::class, 'votePoll']);
        Route::post('/users/{user}/follow', [ProfileController::class, 'toggleFollow']);
        Route::get('/notifications', [NotificationController::class, 'index']);
        Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
        Route::post('/messages/{conversation}/send', [MessagingController::class, 'sendMessage']);
        Route::get('/bookmarks/collections', fn (Request $request) => response()->json($request->user()->bookmarkCollections()->get()));
        Route::post('/bookmarks/collections', [BookmarkController::class, 'storeCollection']);
    });
});
