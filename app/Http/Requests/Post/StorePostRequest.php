<?php

namespace App\Http\Requests\Post;

use App\Models\PlatformSetting;
use Illuminate\Foundation\Http\FormRequest;

class StorePostRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $maxLen = (int) PlatformSetting::getValue('max_post_length', config('pulse.max_post_length', 280));
        $maxMedia = (int) config('pulse.max_media_per_post', 4);
        $maxFileKb = (int) config('pulse.max_video_size_kb', 51200);

        return [
            'content' => ['nullable', 'string', "max:{$maxLen}", 'required_without_all:media,gif_url,repost_of_id,poll'],
            'parent_id' => ['nullable', 'integer', 'exists:posts,id'],
            'repost_of_id' => ['nullable', 'integer', 'exists:posts,id'],
            'visibility' => ['nullable', 'in:public,followers,private'],
            'reply_policy' => ['nullable', 'in:everyone,following,mentioned'],
            'location' => ['nullable', 'string', 'max:120'],
            'gif_url' => ['nullable', 'url', 'max:500'],
            'scheduled_for' => ['nullable', 'date', 'after:now'],
            'media' => ['nullable', 'array', "max:{$maxMedia}"],
            'media.*' => ['file', "max:{$maxFileKb}", 'mimes:jpg,jpeg,png,gif,webp,mp4,mov,webm'],
            'poll' => ['nullable', 'array'],
            'poll.question' => ['nullable', 'string', 'max:280'],
            'poll.options' => ['nullable', 'array', 'min:2', 'max:4'],
            'poll.options.*' => ['required_with:poll.options', 'string', 'max:80'],
            'poll.duration_hours' => ['nullable', 'integer', 'min:1', 'max:168'],
        ];
    }
}
