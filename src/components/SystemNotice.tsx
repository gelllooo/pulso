import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
export function SystemNotice({
  name,
}: {
  name: "facility_notice" | "preparedness_notice";
}) {
  const [value, setValue] = useState("");
  useEffect(() => {
    let active = true;
    void supabase
      ?.from("public_system_notices")
      .select("value")
      .eq("key", name)
      .maybeSingle()
      .then(({ data }) => {
        if (active) setValue(data?.value || "");
      });
    return () => {
      active = false;
    };
  }, [name]);
  return value ? (
    <p className="my-5 whitespace-pre-wrap rounded-xl border border-marine-100 bg-marine-50 p-4 text-sm leading-6">
      {value}
    </p>
  ) : null;
}
