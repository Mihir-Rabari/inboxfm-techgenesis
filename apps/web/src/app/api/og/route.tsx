import { ImageResponse } from 'next/og';
// App router includes ImageResponse in next/og

export const runtime = 'edge';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);

        const title = searchParams.get('title') || 'Inbox FM';
        const subtitle = searchParams.get('subtitle') || 'AI-Powered Daily Email Briefs';
        const type = searchParams.get('type') || 'page';

        return new ImageResponse(
            (
                <div
                    style={{
                        height: '100%',
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#000',
                        backgroundImage: 'radial-gradient(circle at 50% 50%, #2a104a 0%, #000 100%)',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            padding: '60px 100px',
                            borderRadius: '40px',
                            backdropFilter: 'blur(20px)',
                        }}
                    >
                        <div style={{ fontSize: 24, fontWeight: 'bold', color: '#a855f7', marginBottom: 20, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                            {type === 'release' ? 'New Release' : 'Founder Profile'}
                        </div>
                        <div
                            style={{
                                fontSize: 80,
                                fontWeight: 'black',
                                color: 'white',
                                textAlign: 'center',
                                marginBottom: 20,
                                letterSpacing: '-0.02em',
                            }}
                        >
                            {title}
                        </div>
                        <div
                            style={{
                                fontSize: 32,
                                color: 'rgba(255, 255, 255, 0.6)',
                                textAlign: 'center',
                                maxWidth: '800px',
                            }}
                        >
                            {subtitle}
                        </div>
                    </div>
                    
                    <div style={{ position: 'absolute', bottom: 40, display: 'flex', alignItems: 'center' }}>
                        <div style={{ color: 'white', fontSize: 32, fontWeight: 'bold' }}>Inbox FM</div>
                    </div>
                </div>
            ),
            {
                width: 1200,
                height: 630,
            },
        );
    } catch (e: any) {
        return new Response(`Failed to generate the image`, {
            status: 500,
        });
    }
}
