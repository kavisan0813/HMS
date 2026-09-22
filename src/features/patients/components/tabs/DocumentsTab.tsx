/**
 * DocumentsTab – Patient Profile Tab for Document Management
 */
import { useState, useEffect } from "react";
import {
  FileText,
  Upload,
  Download,
  Trash2,
  Plus,
  X,
  FileCheck,
  Calendar,
  Tag,
  HardDrive,
} from "lucide-react";
import type { Patient, ApiPatientDocument } from "../../types/patient.types";
import { PP, RB } from "../../../doctors/constants/doctors.constants";
import { patientsApi } from "../../api/patient.api";

export interface DocumentsTabProps {
  patient: Patient;
  canEdit: boolean;
  isOwnProfile: boolean;
}

const CATEGORIES = [
  "Medical Report",
  "Lab Test",
  "ID Proof",
  "Insurance Document",
  "Prescription Copy",
  "Radiology / Scan",
  "Other",
];

export function PatientDocumentsTab({ patient, canEdit }: DocumentsTabProps) {
  const [documents, setDocuments] = useState<ApiPatientDocument[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formCategory, setFormCategory] = useState("Medical Report");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const mrn = patient.mrn || String(patient.id || "");

  useEffect(() => {
    let active = true;

    patientsApi
      .getDocuments(mrn)
      .then((list) => {
        if (active) {
          setDocuments(list || []);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setDocuments([]);
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [mrn]);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    setIsUploading(true);
    try {
      const ext = selectedFile?.name.split(".").pop()?.toUpperCase() || "PDF";
      const sizeStr = selectedFile
        ? `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB`
        : "1.2 MB";

      const created = await patientsApi.uploadDocument(mrn, {
        title: formTitle,
        category: formCategory,
        fileType: ext,
        fileSize: sizeStr,
      });

      setDocuments((prev) => [created, ...prev]);
      triggerToast(`Document "${formTitle}" uploaded successfully!`);
      setShowUploadModal(false);
      setFormTitle("");
      setSelectedFile(null);
    } catch (err) {
      console.log(err);
      triggerToast("Failed to upload document. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (docId: string, title: string) => {
    try {
      await patientsApi.deleteDocument(mrn, docId);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
      triggerToast(`Document "${title}" deleted.`);
    } catch (err) {
      console.log(err);
      triggerToast("Failed to delete document.");
    } finally {
      setDeletingDocId(null);
    }
  };

  return (
    <div className="space-y-4" style={{ fontFamily: RB }}>
      {/* Toast Feedback */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 bg-[#111827] text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2">
          <FileCheck size={16} className="text-[#66BB6A]" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3
            className="text-sm font-bold text-[#111827]"
            style={{ fontFamily: PP }}
          >
            Patient Medical Documents
          </h3>
          <p className="text-xs text-[#64748B] mt-0.5">
            Manage lab reports, identity proofs, prescriptions, and health
            documents.
          </p>
        </div>

        {canEdit && (
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition-colors cursor-pointer hover:bg-[#0c3d8a]"
            style={{ backgroundColor: "#0D47A1", fontFamily: PP }}
          >
            <Plus size={15} /> Upload Document
          </button>
        )}
      </div>

      {/* Document List Workspace */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-xs text-[#64748B]">
          Loading patient documents...
        </div>
      ) : documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 border border-dashed border-[#E5E7EB] rounded-2xl bg-slate-50 text-center">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mb-3 text-[#0D47A1]">
            <FileText size={24} />
          </div>
          <p
            className="text-sm font-semibold text-[#111827] mb-1"
            style={{ fontFamily: PP }}
          >
            No documents uploaded yet.
          </p>
          <p className="text-xs text-[#64748B] max-w-sm mx-auto">
            Upload patient lab reports, scan results, or ID proofs to store them
            securely.
          </p>
          {canEdit && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="mt-4 flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-[#0D47A1] bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors"
            >
              <Upload size={14} /> Upload First Document
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-xs hover:border-blue-200 transition-colors flex flex-col justify-between space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0D47A1] font-bold flex items-center justify-center text-xs shrink-0 border border-blue-100">
                    {doc.fileType || "PDF"}
                  </div>
                  <div>
                    <h4
                      className="text-xs font-bold text-[#111827] line-clamp-1"
                      style={{ fontFamily: PP }}
                    >
                      {doc.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700">
                        <Tag size={10} /> {doc.category}
                      </span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                        <HardDrive size={10} /> {doc.fileSize}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-[#64748B]">
                <span className="flex items-center gap-1">
                  <Calendar size={11} /> Uploaded {doc.uploadDate}
                </span>

                <div className="flex items-center gap-1.5">
                  <a
                    href={doc.url || "#"}
                    download={doc.title}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg bg-blue-50 text-[#0D47A1] hover:bg-blue-100 transition-colors"
                    title="Download / View"
                  >
                    <Download size={13} />
                  </a>

                  {canEdit && (
                    <button
                      onClick={() => setDeletingDocId(doc.id)}
                      className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors cursor-pointer"
                      title="Delete Document"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>

              {/* Confirm Delete Banner */}
              {deletingDocId === doc.id && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-2 text-xs">
                  <span className="font-semibold text-red-900 block">
                    Are you sure you want to delete this document?
                  </span>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setDeletingDocId(null)}
                      className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleDelete(doc.id, doc.title)}
                      className="px-2.5 py-1 text-[11px] font-bold text-white bg-red-600 rounded-lg hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal: Upload Document */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            role="presentation"
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setShowUploadModal(false)}
          />

          <div className="relative bg-white rounded-2xl border border-gray-100 shadow-2xl max-w-md w-full overflow-hidden z-10">
            {/* Modal Header */}
            <div className="p-4 bg-[#0D47A1] text-white flex items-center justify-between">
              <h3
                className="text-sm font-bold flex items-center gap-2"
                style={{ fontFamily: PP }}
              >
                <Upload size={16} /> Upload Patient Document
              </h3>
              <button
                aria-label="Close"
                onClick={() => setShowUploadModal(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Form */}
            <form
              onSubmit={handleUploadSubmit}
              className="p-5 space-y-4 text-xs"
            >
              <div>
                <label className="block text-[#111827] font-bold mb-1">
                  Document Title *
                </label>
                <input
                  aria-label="Input field"
                  type="text"
                  required
                  placeholder="e.g. Lipid Profile Lab Results, Chest X-Ray"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-[#E5E7EB] rounded-xl outline-none focus:border-[#0D47A1]"
                />
              </div>

              <div>
                <label className="block text-[#111827] font-bold mb-1">
                  Category *
                </label>
                <select
                  aria-label="Select option"
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-[#E5E7EB] rounded-xl outline-none focus:border-[#0D47A1]"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#111827] font-bold mb-1">
                  Choose File (PDF, JPG, PNG)
                </label>
                <input
                  aria-label="Input field"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setSelectedFile(e.target.files[0]);
                      if (!formTitle) {
                        setFormTitle(e.target.files[0].name.split(".")[0]);
                      }
                    }
                  }}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-[#0D47A1] hover:file:bg-blue-100"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !formTitle.trim()}
                  className="px-4 py-2 rounded-xl bg-[#0D47A1] text-white font-bold hover:bg-[#0c3d8a] transition-colors disabled:opacity-50"
                  style={{ fontFamily: PP }}
                >
                  {isUploading ? "Uploading..." : "Save Document"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
