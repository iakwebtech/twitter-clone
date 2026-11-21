<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('bio', 200)->nullable();
            $table->string('location', 100)->nullable();
            $table->string('website', 255)->nullable();
            $table->date('birth_date')->nullable();
            $table->string('avatar')->nullable();
            $table->string('cover_image')->nullable();
            $table->unsignedBigInteger('followers_count')->default(0);
            $table->unsignedBigInteger('following_count')->default(0);
            $table->unsignedBigInteger('posts_count')->default(0);
            $table->timestamps();
        });

        Schema::create('user_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->enum('who_can_reply', ['everyone', 'following', 'mentioned'])->default('everyone');
            $table->enum('who_can_mention', ['everyone', 'following', 'nobody'])->default('everyone');
            $table->enum('who_can_message', ['everyone', 'following', 'nobody'])->default('everyone');
            $table->boolean('email_notifications')->default(true);
            $table->boolean('push_notifications')->default(true);
            $table->enum('theme', ['system', 'light', 'dark'])->default('system');
            $table->boolean('two_factor_enabled')->default(false);
            $table->string('two_factor_secret')->nullable();
            $table->timestamps();
        });

        Schema::create('login_activities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('session_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->string('device', 120)->nullable();
            $table->string('location', 120)->nullable();
            $table->timestamp('logged_in_at');
            $table->boolean('is_current')->default(false);
            $table->timestamps();

            $table->index(['user_id', 'logged_in_at']);
        });

        Schema::create('recent_searches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('query', 120);
            $table->timestamps();

            $table->index(['user_id', 'updated_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('recent_searches');
        Schema::dropIfExists('login_activities');
        Schema::dropIfExists('user_settings');
        Schema::dropIfExists('user_profiles');
    }
};
