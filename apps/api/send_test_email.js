const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./dist/app.module');
const { MailService } = require('./dist/modules/mail/mail.service');

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const mailService = app.get(MailService);
    
    const targetEmail = 'test-zprwxu8sq@srv1.mail-tester.com';
    console.log(`Sending test welcome email to ${targetEmail}...`);
    
    try {
        await mailService.sendWelcomeEmail(targetEmail, 'Mail Tester');
        console.log('Successfully sent welcome email!');
    } catch (err) {
        console.error('Error sending welcome email:', err);
    } finally {
        await app.close();
    }
}

bootstrap().catch(console.error);
