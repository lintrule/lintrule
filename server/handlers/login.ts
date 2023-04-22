export const handleLogin = async (request: Request): Promise<Response> => {
  const body = await request.json();
  return new Response("howdy partner", { status: 200 });
};
