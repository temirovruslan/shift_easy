const Loader = ({ message = "Loading…" }: { message?: string }) => {
  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center gap-5">
      <div className="w-16 h-16 rounded-2xl bg-blue/10 border border-blue/20 flex items-center justify-center">
        <div className="w-7 h-7 rounded-full border-2 border-border border-t-blue animate-spin" />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-text">ShiftEasy</p>
        <p className="text-xs text-text3 mt-1">{message}</p>
      </div>
    </div>
  );
};

export default Loader;
