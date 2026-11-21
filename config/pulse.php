<?php

return [
    'name' => env('APP_NAME', 'Pulse'),
    'max_post_length' => (int) env('PULSE_MAX_POST_LENGTH', 280),
    'max_media_per_post' => (int) env('PULSE_MAX_MEDIA_PER_POST', 4),
    'max_image_size_kb' => (int) env('PULSE_MAX_IMAGE_SIZE_KB', 5120),
    'max_video_size_kb' => (int) env('PULSE_MAX_VIDEO_SIZE_KB', 51200),
    'max_message_attachment_kb' => (int) env('PULSE_MAX_MESSAGE_ATTACHMENT_KB', 10240),
    'poll_max_options' => (int) env('PULSE_POLL_MAX_OPTIONS', 4),
    'poll_default_hours' => (int) env('PULSE_POLL_DEFAULT_HOURS', 24),
    'feed_per_page' => (int) env('PULSE_FEED_PER_PAGE', 15),
];
