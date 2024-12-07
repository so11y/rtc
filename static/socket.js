export function useSocket() {
  const ws = new WebSocket("ws://localhost:3000");
  const state = Promise.withResolvers();
  const map = new Map();
  ws.addEventListener("open", state.resolve);

  ws.addEventListener("message", (event) => {
    const data = JSON.parse(event.data);
    if (data.type === "eat") {
      map.get(data.id)(data.data);
      map.delete(data.id);
    }
  });
  function asyncSend(data) {
    const state = Promise.withResolvers();
    data.id = Math.random();
    map.set(data.id, state.resolve);
    ws.send(JSON.stringify(data));
    return state.promise;
  }

  return {
    ready: state.promise,
    ws,
    asyncSend,
    asyncPass(data) {
      data.pass = true;
      return asyncSend(data);
    },
  };
}
