const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./dist/app.module');
const { BriefService } = require('./dist/modules/brief/brief.service');

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const briefService = app.get(BriefService);
    
    console.log('Triggering brief for schedule: 93bca277-624f-470f-9ec8-2e79a105752f');
    
    await briefService.queueBriefGeneration(
        '4e1eac9a-7449-4247-9481-8dcbf91db356', // userId
        '93bca277-624f-470f-9ec8-2e79a105752f', // scheduleId
        {
            voicePersona: 'NEWSROOM',
            customPrompt: null
        }
    );
    
    console.log('Successfully queued brief for generation!');
    await app.close();
}

bootstrap().catch(console.error);
