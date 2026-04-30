import { useState } from "react";
import { toast } from "sonner";

type AsyncFunction<Args extends unknown[], Return> = (
  ...args: Args
) => Promise<Return>;

const useFetch = <Args extends unknown[], Return>(
  cb: AsyncFunction<Args, Return>,
) => {
  const [data, setData] = useState<Return | undefined>(undefined);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);

  const fn = async (...args: Args) => {
    setLoading(true);
    setError(null);

    try {
      const response = await cb(...args);
      setData(response);
      return response;
    } catch (error) {
      const err =
        error instanceof Error ? error : new Error("An unknown error occurred");

      setError(err);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, fn, setData };
};

export default useFetch;
