<?php

namespace App\Http\Requests\Messaging;

use Illuminate\Foundation\Http\FormRequest;

class SendMessageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $maxKb = (int) config('pulse.max_message_attachment_kb', 10240);

        return [
            'body' => ['nullable', 'string', 'max:2000', 'required_without:attachments'],
            'reply_to_id' => ['nullable', 'integer', 'exists:messages,id'],
            'attachments' => ['nullable', 'array', 'max:4'],
            'attachments.*' => ['file', "max:{$maxKb}"],
        ];
    }
}
