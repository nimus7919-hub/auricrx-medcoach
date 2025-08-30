import React from "react";
import DocumentsCard from "@/components/DocumentsCard";

export default function DocumentsPage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <DocumentsCard
        defaultCountry="MX"
        onSave={async (kind, file) => {
          // Leave as no-op for now (keeps Recent working).
          // Example backend:
          // const form = new FormData();
          // form.append("kind", kind);
          // form.append("file", file);
          // await fetch("/api/documents/upload", { method: "POST", body: form, credentials: "include" });
        }}
        // onDelete={async (kind, doc) => {
        //   await fetch(`/api/documents?kind=${kind}&name=${encodeURIComponent(doc.name)}`, {
        //     method: "DELETE",
        //     credentials: "include",
        //   });
        // }}
      />
    </div>
  );
}
