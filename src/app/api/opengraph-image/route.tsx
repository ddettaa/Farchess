import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { getNeynarUser } from "~/lib/neynar";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fid = searchParams.get('fid');

  const user = fid ? await getNeynarUser(Number(fid)) : null;

  const imageResponse = new ImageResponse(
    (
      <div tw="flex h-full w-full flex-col justify-center items-center relative" style={{ background: 'linear-gradient(135deg, #0D0C33 0%, #1a1a4e 50%, #2d1b69 100%)' }}>
        {/* Chess Pattern Background */}
        <div tw="absolute inset-0 flex flex-wrap opacity-10">
          {Array(64).fill(0).map((_, i) => (
            <div
              key={i}
              tw="w-[150px] h-[100px]"
              style={{ background: i % 2 === (Math.floor(i / 8) % 2) ? '#fff' : 'transparent' }}
            />
          ))}
        </div>
        
        {/* Content */}
        <div tw="flex flex-col items-center justify-center relative z-10">
          {/* Chess Pieces Decoration */}
          <div tw="flex items-center mb-6 text-8xl">
            <span>♔</span>
            <span tw="mx-4 text-9xl">♟</span>
            <span>♚</span>
          </div>
          
          {/* Logo/Title */}
          <h1 tw="text-8xl font-black text-white tracking-tight m-0" style={{ textShadow: '4px 4px 0px #3533cd' }}>
            FarChess
          </h1>
          
          {/* Tagline */}
          <p tw="text-3xl text-purple-300 mt-4 font-medium">
            On-chain Chess on Base ⛓️
          </p>
          
          {/* User Section (if fid provided) */}
          {user && (
            <div tw="flex items-center mt-10 px-6 py-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.1)' }}>
              {user.pfp_url && (
                <img 
                  src={user.pfp_url} 
                  alt="Profile" 
                  tw="w-20 h-20 rounded-full border-4 border-white mr-4"
                  style={{ objectFit: 'cover' }}
                />
              )}
              <div tw="flex flex-col">
                <span tw="text-2xl font-bold text-white">
                  {user.display_name || user.username} wants to play!
                </span>
                <span tw="text-xl text-purple-200">@{user.username}</span>
              </div>
            </div>
          )}
          
          {/* Call to Action */}
          <div tw="mt-10 px-8 py-4 text-2xl font-bold text-white rounded-lg" style={{ background: '#3533cd', boxShadow: '4px 4px 0px #000' }}>
            🎮 Play Now
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );

  // Set cache headers to prevent long-term caching
  imageResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  imageResponse.headers.set('Pragma', 'no-cache');
  imageResponse.headers.set('Expires', '0');

  return imageResponse;
}

