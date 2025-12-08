import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { getNeynarUser } from "~/lib/neynar";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fid = searchParams.get('fid');

  const user = fid ? await getNeynarUser(Number(fid)) : null;

  return new ImageResponse(
    (
      <div tw="flex h-full w-full flex-col justify-center items-center bg-slate-950 text-white">
        {/* Background Gradient Mesh */}
        <div tw="flex absolute inset-0 bg-gradient-to-br from-indigo-900/40 via-purple-900/40 to-slate-950" />
        
        <div tw="flex flex-col items-center justify-center relative z-10">
          {user?.pfp_url && (
            <div tw="flex p-1.5 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-full mb-10 shadow-2xl">
              <img 
                src={user.pfp_url} 
                alt="Profile" 
                tw="w-64 h-64 rounded-full border-4 border-slate-950"
                style={{ objectFit: 'cover' }}
              />
            </div>
          )}
          <h1 tw="text-7xl font-black text-center tracking-tight text-white m-0 leading-tight">
            {user?.display_name ? `Hello from ${user.display_name}!` : 'Hello!'}
          </h1>
          {user?.username && (
            <p tw="text-4xl text-slate-400 mt-4 font-medium">@{user.username}</p>
          )}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 800,
    }
  );
}