<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('posts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('parent_id')->nullable()->constrained('posts')->cascadeOnDelete();
            $table->foreignId('repost_of_id')->nullable()->constrained('posts')->cascadeOnDelete();
            $table->text('content')->nullable();
            $table->enum('visibility', ['public', 'followers', 'private'])->default('public');
            $table->enum('reply_policy', ['everyone', 'following', 'mentioned'])->default('everyone');
            $table->string('location', 120)->nullable();
            $table->boolean('is_pinned')->default(false);
            $table->boolean('is_quote')->default(false);
            $table->unsignedBigInteger('likes_count')->default(0);
            $table->unsignedBigInteger('reposts_count')->default(0);
            $table->unsignedBigInteger('replies_count')->default(0);
            $table->unsignedBigInteger('bookmarks_count')->default(0);
            $table->unsignedBigInteger('views_count')->default(0);
            $table->timestamp('scheduled_at')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->softDeletes();
            $table->timestamps();

            $table->index(['user_id', 'created_at']);
            $table->index(['parent_id', 'created_at']);
            $table->index(['visibility', 'published_at']);
            $table->index('repost_of_id');
        });

        Schema::table('user_profiles', function (Blueprint $table) {
            $table->foreignId('pinned_post_id')->nullable()->after('cover_image')->constrained('posts')->nullOnDelete();
        });

        Schema::create('post_media', function (Blueprint $table) {
            $table->id();
            $table->foreignId('post_id')->constrained()->cascadeOnDelete();
            $table->enum('type', ['image', 'video', 'gif'])->default('image');
            $table->string('file_path');
            $table->string('thumbnail_path')->nullable();
            $table->string('mime_type', 100)->nullable();
            $table->unsignedBigInteger('file_size')->default(0);
            $table->unsignedInteger('width')->nullable();
            $table->unsignedInteger('height')->nullable();
            $table->string('alt_text', 400)->nullable();
            $table->unsignedTinyInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['post_id', 'sort_order']);
        });

        Schema::create('post_likes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('post_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['user_id', 'post_id']);
            $table->index('post_id');
        });

        Schema::create('post_reposts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('post_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['user_id', 'post_id']);
            $table->index('post_id');
        });

        Schema::create('post_bookmarks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('post_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['user_id', 'post_id']);
        });

        Schema::create('bookmarks_collections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name', 80);
            $table->string('description', 200)->nullable();
            $table->timestamps();

            $table->index('user_id');
        });

        Schema::create('bookmarks_collection_posts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('collection_id')->constrained('bookmarks_collections')->cascadeOnDelete();
            $table->foreignId('post_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['collection_id', 'post_id']);
        });

        Schema::create('post_drafts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->text('content')->nullable();
            $table->json('media_paths')->nullable();
            $table->json('poll_data')->nullable();
            $table->enum('visibility', ['public', 'followers', 'private'])->default('public');
            $table->string('location', 120)->nullable();
            $table->timestamps();

            $table->index(['user_id', 'updated_at']);
        });

        Schema::create('scheduled_posts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->text('content')->nullable();
            $table->json('media_paths')->nullable();
            $table->json('poll_data')->nullable();
            $table->enum('visibility', ['public', 'followers', 'private'])->default('public');
            $table->string('location', 120)->nullable();
            $table->timestamp('scheduled_for');
            $table->enum('status', ['pending', 'published', 'failed', 'cancelled'])->default('pending');
            $table->foreignId('published_post_id')->nullable()->constrained('posts')->nullOnDelete();
            $table->timestamps();

            $table->index(['status', 'scheduled_for']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('scheduled_posts');
        Schema::dropIfExists('post_drafts');
        Schema::dropIfExists('bookmarks_collection_posts');
        Schema::dropIfExists('bookmarks_collections');
        Schema::dropIfExists('post_bookmarks');
        Schema::dropIfExists('post_reposts');
        Schema::dropIfExists('post_likes');
        Schema::dropIfExists('post_media');
        Schema::table('user_profiles', function (Blueprint $table) {
            $table->dropConstrainedForeignId('pinned_post_id');
        });
        Schema::dropIfExists('posts');
    }
};
