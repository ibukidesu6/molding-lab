// Basic 認証。ID/パスワードは Netlify の環境変数 SITE_USER / SITE_PASSWORD。
// SITE_PASSWORD が未設定のあいだは誰も入れない（公開事故を防ぐため）。
export default async (request: Request, context: any) => {
  const user = Netlify.env.get("SITE_USER") ?? "";
  const pass = Netlify.env.get("SITE_PASSWORD") ?? "";
  const header = request.headers.get("authorization") ?? "";
  if (pass && header.startsWith("Basic ")) {
    try {
      const [u, ...rest] = atob(header.slice(6)).split(":");
      if (u === user && rest.join(":") === pass) {
        const res = await context.next();
        res.headers.set("X-Robots-Tag", "noindex, nofollow");
        return res;
      }
    } catch {}
  }
  return new Response("認証が必要です", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="MOLD LAB", charset="UTF-8"',
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
};

export const config = { path: "/*" };
