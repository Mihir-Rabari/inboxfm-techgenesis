const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./dist/app.module');
const { GmailService } = require('./dist/modules/gmail/gmail.service');
const { AiService } = require('./dist/modules/ai/ai.service');

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const gmailService = app.get(GmailService);
    const aiService = app.get(AiService);
    
    console.log('Fetching emails...');
    const userId = '3c777950-22f7-448c-8a13-227a2fb2be4b';
    
    try {
        const rawEmails = await gmailService.fetchRecentEmails(userId);
        console.log(`Fetched ${rawEmails.length} emails. Identifying important ones...`);
        
        if (rawEmails.length === 0) {
            console.log('No recent emails to summarize.');
            return;
        }

        const processedEmails = await aiService.analyzeEmails(rawEmails);
        console.log(`Analyzed ${processedEmails.length} important emails. Generating script...`);
        
        const script = await aiService.generateScript(
            processedEmails,
            'NEWSROOM', // persona
            'User',     // name
            null        // custom prompt
        );
        
        console.log('\n=======================================');
        console.log('         GENERATED SCRIPT JSON         ');
        console.log('=======================================');
        console.dir(script, { depth: null });
        
        // Also combine it into a readable text format
        console.log('\n=======================================');
        console.log('         READABLE SCRIPT TEXT          ');
        console.log('=======================================');
        console.log(script.map(s => s.text).join('\n\n'));
        
    } catch (err) {
        console.error('Error generating script:', err.message);
    } finally {
        await app.close();
    }
}

bootstrap().catch(console.error);
