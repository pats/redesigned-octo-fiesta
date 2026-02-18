import { TCF_STUB_JS } from "@/lib/tcf/stub-script";

/**
 * Server component that injects the TCF API stub synchronously in <head>.
 * This ensures window.__tcfapi exists before any vendor scripts execute.
 */
export default function TcfStubScript() {
  return <script dangerouslySetInnerHTML={{ __html: TCF_STUB_JS }} />;
}
