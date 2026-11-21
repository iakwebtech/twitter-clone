<?php

use App\Http\Controllers\Admin\AdminController;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\BookmarkController;
use App\Http\Controllers\ExploreController;
use App\Http\Controllers\FeedController;
use App\Http\Controllers\ListController;
use App\Http\Controllers\MessagingController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PostController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\SettingsController;
use Illuminate\Support\Facades\Route;

// Public Feed & Explore (guests can browse public timeline & profiles)
Route::get('/', [FeedController::class, 'index'])->name('home');
Route::get('/explore', [ExploreController::class, 'index'])->name('explore');
Route::get('/search/suggestions', [ExploreController::class, 'suggestions'])->name('search.suggestions');
Route::get('/posts/{post}', [PostController::class, 'show'])->name('posts.show');

// Guest Authentication Routes
Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1');
    Route::get('/register', [AuthController::class, 'showRegister'])->name('register');
    Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:5,1');
    Route::get('/forgot-password', [AuthController::class, 'showForgotPassword'])->name('password.request');
    Route::post('/forgot-password', [AuthController::class, 'sendResetLink'])->name('password.email');
    Route::get('/reset-password/{token}', [AuthController::class, 'showResetPassword'])->name('password.reset');
    Route::post('/reset-password', [AuthController::class, 'resetPassword'])->name('password.update');
});

Route::get('/check-username', [AuthController::class, 'checkUsername'])->name('username.check');

// Email Verification Routes
Route::middleware('auth')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');
    Route::get('/email/verify', [AuthController::class, 'verifyEmailNotice'])->name('verification.notice');
    Route::get('/email/verify/{id}/{hash}', [AuthController::class, 'verifyEmail'])
        ->middleware(['signed', 'throttle:6,1'])
        ->name('verification.verify');
    Route::post('/email/verification-notification', [AuthController::class, 'resendVerification'])
        ->middleware('throttle:6,1')
        ->name('verification.send');
});

// Authenticated & Active User Routes
Route::middleware(['auth', 'active.user'])->group(function () {
    // Posts & Engagement
    Route::post('/posts', [PostController::class, 'store'])->middleware('throttle:30,1')->name('posts.store');
    Route::patch('/posts/{post}', [PostController::class, 'update'])->name('posts.update');
    Route::delete('/posts/{post}', [PostController::class, 'destroy'])->name('posts.destroy');
    Route::post('/posts/{post}/pin', [PostController::class, 'togglePin'])->name('posts.pin');
    Route::post('/posts/{post}/like', [PostController::class, 'like'])->name('posts.like');
    Route::post('/posts/{post}/repost', [PostController::class, 'repost'])->name('posts.repost');
    Route::post('/posts/{post}/bookmark', [PostController::class, 'bookmark'])->name('posts.bookmark');
    Route::post('/posts/{post}/vote', [PostController::class, 'votePoll'])->name('posts.vote');

    // Drafts & Scheduled
    Route::get('/drafts', [PostController::class, 'drafts'])->name('drafts.index');
    Route::post('/drafts', [PostController::class, 'saveDraft'])->name('drafts.store');
    Route::delete('/drafts/{draft}', [PostController::class, 'deleteDraft'])->name('drafts.destroy');
    Route::post('/scheduled/{scheduledPost}/cancel', [PostController::class, 'cancelScheduled'])->name('scheduled.cancel');

    // Profile & Social Graph
    Route::post('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::post('/users/{user}/follow', [ProfileController::class, 'toggleFollow'])->name('users.follow');
    Route::post('/follow-requests/{followRequest}/respond', [ProfileController::class, 'respondFollowRequest'])->name('follow-requests.respond');
    Route::delete('/followers/{user}', [ProfileController::class, 'removeFollower'])->name('followers.remove');
    Route::post('/users/{user}/block', [ProfileController::class, 'toggleBlock'])->name('users.block');
    Route::post('/users/{user}/mute', [ProfileController::class, 'toggleMute'])->name('users.mute');

    // Explore recent searches
    Route::delete('/search/recent', [ExploreController::class, 'clearRecentSearches'])->name('search.clear');

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead'])->name('notifications.read');
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead'])->name('notifications.read-all');
    Route::delete('/notifications/{id}', [NotificationController::class, 'destroy'])->name('notifications.destroy');

    // Direct Messaging
    Route::get('/messages', [MessagingController::class, 'index'])->name('messages.index');
    Route::get('/messages/{conversation}', [MessagingController::class, 'index'])->name('messages.show');
    Route::post('/messages/direct/{user}', [MessagingController::class, 'startDirect'])->name('messages.direct');
    Route::post('/messages/group', [MessagingController::class, 'createGroup'])->name('messages.group');
    Route::post('/messages/{conversation}/send', [MessagingController::class, 'sendMessage'])->name('messages.send');
    Route::post('/messages/{conversation}/typing', [MessagingController::class, 'typing'])->name('messages.typing');
    Route::get('/messages/{conversation}/search', [MessagingController::class, 'searchMessages'])->name('messages.search');
    Route::delete('/messages/item/{message}', [MessagingController::class, 'destroyMessage'])->name('messages.destroy');

    // Bookmarks & Collections
    Route::get('/bookmarks', [BookmarkController::class, 'index'])->name('bookmarks.index');
    Route::post('/bookmarks/collections', [BookmarkController::class, 'storeCollection'])->name('bookmarks.collections.store');
    Route::delete('/bookmarks/collections/{collection}', [BookmarkController::class, 'destroyCollection'])->name('bookmarks.collections.destroy');
    Route::post('/bookmarks/collections/{collection}/posts/{post}', [BookmarkController::class, 'toggleCollectionPost'])->name('bookmarks.collections.toggle');

    // Lists
    Route::get('/lists', [ListController::class, 'index'])->name('lists.index');
    Route::post('/lists', [ListController::class, 'store'])->name('lists.store');
    Route::get('/lists/{list}', [ListController::class, 'show'])->name('lists.show');
    Route::delete('/lists/{list}', [ListController::class, 'destroy'])->name('lists.destroy');
    Route::post('/lists/{list}/members', [ListController::class, 'toggleMember'])->name('lists.members.toggle');

    // Reports
    Route::post('/reports', [ReportController::class, 'store'])->middleware('throttle:10,1')->name('reports.store');

    // Account & Privacy Settings
    Route::get('/settings', [SettingsController::class, 'index'])->name('settings.index');
    Route::patch('/settings', [SettingsController::class, 'update'])->name('settings.update');
    Route::put('/settings/password', [SettingsController::class, 'changePassword'])->name('settings.password');
    Route::post('/settings/deactivate', [SettingsController::class, 'deactivate'])->name('settings.deactivate');
    Route::delete('/settings/account', [SettingsController::class, 'destroyAccount'])->name('settings.destroy');

    // Admin Dashboard
    Route::prefix('admin')->name('admin.')->middleware('admin')->group(function () {
        Route::get('/', [AdminController::class, 'dashboard'])->name('dashboard');
        Route::get('/users', [AdminController::class, 'users'])->name('users');
        Route::post('/users/{user}/verify', [AdminController::class, 'toggleVerify'])->name('users.verify');
        Route::post('/users/{user}/suspend', [AdminController::class, 'toggleSuspend'])->name('users.suspend');
        Route::delete('/users/{user}', [AdminController::class, 'destroyUser'])->name('users.destroy');
        Route::get('/content', [AdminController::class, 'content'])->name('content');
        Route::delete('/posts/{post}', [AdminController::class, 'destroyPost'])->name('posts.destroy');
        Route::post('/hashtags/{hashtag}/restrict', [AdminController::class, 'toggleRestrictHashtag'])->name('hashtags.restrict');
        Route::post('/topics', [AdminController::class, 'storeTopic'])->name('topics.store');
        Route::get('/reports', [AdminController::class, 'reports'])->name('reports');
        Route::patch('/reports/{report}', [AdminController::class, 'updateReport'])->name('reports.update');
        Route::get('/settings', [AdminController::class, 'settings'])->name('settings');
        Route::post('/settings', [AdminController::class, 'updateSettings'])->name('settings.update');
    });
});

// Public Profile Routes (placed last to avoid wildcard conflicts)
Route::get('/@{username}', [ProfileController::class, 'show'])->name('profile.show');
Route::get('/@{username}/followers', [ProfileController::class, 'followers'])->name('profile.followers');
Route::get('/@{username}/following', [ProfileController::class, 'following'])->name('profile.following');
