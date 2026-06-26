import { Module } from '@nestjs/common';
import { AudioService } from './audio.service';
import { SttService } from './stt.service';

@Module({
    providers: [AudioService, SttService],
    exports: [AudioService, SttService],
})
export class AudioModule { }

