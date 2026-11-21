<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hashtags', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100)->unique();
            $table->string('slug', 120)->unique();
            $table->unsignedBigInteger('posts_count')->default(0);
            $table->boolean('is_restricted')->default(false);
            $table->boolean('is_trending')->default(false);
            $table->timestamps();

            $table->index(['is_restricted', 'posts_count']);
        });

        Schema::create('post_hashtags', function (Blueprint $table) {
            $table->id();
            $table->foreignId('post_id')->constrained()->cascadeOnDelete();
            $table->foreignId('hashtag_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['post_id', 'hashtag_id']);
            $table->index('hashtag_id');
        });

        Schema::create('trending_topics', function (Blueprint $table) {
            $table->id();
            $table->string('title', 120);
            $table->string('category', 60)->default('General');
            $table->unsignedBigInteger('posts_count')->default(0);
            $table->float('score')->default(0);
            $table->boolean('is_active')->default(true);
            $table->enum('period', ['24h', '7d', 'all'])->default('24h');
            $table->timestamps();

            $table->index(['is_active', 'period', 'score']);
        });

        Schema::create('polls', function (Blueprint $table) {
            $table->id();
            $table->foreignId('post_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('question', 280)->nullable();
            $table->timestamp('expires_at');
            $table->unsignedBigInteger('total_votes')->default(0);
            $table->timestamps();

            $table->index('expires_at');
        });

        Schema::create('poll_options', function (Blueprint $table) {
            $table->id();
            $table->foreignId('poll_id')->constrained()->cascadeOnDelete();
            $table->string('option_text', 80);
            $table->unsignedBigInteger('votes_count')->default(0);
            $table->unsignedTinyInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('poll_votes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('poll_id')->constrained()->cascadeOnDelete();
            $table->foreignId('poll_option_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['poll_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('poll_votes');
        Schema::dropIfExists('poll_options');
        Schema::dropIfExists('polls');
        Schema::dropIfExists('trending_topics');
        Schema::dropIfExists('post_hashtags');
        Schema::dropIfExists('hashtags');
    }
};
