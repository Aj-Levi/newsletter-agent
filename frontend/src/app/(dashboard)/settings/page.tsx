"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { toast } from "react-toastify";
import ToastStyles from "@/styles/ToastStyles";
import { User, Lock, AlertOctagon, X, AlertCircle } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();

  // Load state
  const [loadingSession, setLoadingSession] = useState(true);

  // Profile Form States
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [originalEmail, setOriginalEmail] = useState("");
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Password Form States
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Delete Account States
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);

  // Fetch session data client-side
  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error("Failed to load session");
      })
      .then((session) => {
        if (session?.user) {
          setName(session.user.name || "");
          setEmail(session.user.email || "");
          setOriginalEmail(session.user.email || "");
        }
      })
      .catch((err) => console.error("Error fetching session:", err))
      .finally(() => setLoadingSession(false));
  }, []);

  // Handle Profile Update
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name cannot be empty", ToastStyles);
      return;
    }
    if (!email.trim()) {
      toast.error("Email cannot be empty", ToastStyles);
      return;
    }

    setUpdatingProfile(true);
    try {
      const response = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim() }),
      });
      const data = await response.json();

      if (response.ok) {
        toast.success("Profile updated successfully! Reloading session...", ToastStyles);
        setOriginalEmail(email.trim());
        // Sync local storage or trigger reload to refresh layout profile card
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        toast.error(data.error || "Failed to update profile", ToastStyles);
      }
    } catch (err) {
      console.error("Profile update error:", err);
      toast.error("Network error while updating profile", ToastStyles);
    } finally {
      setUpdatingProfile(false);
    }
  };

  // Handle Password Update
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || newPassword.length < 8) {
      toast.error("New password must be at least 8 characters long", ToastStyles);
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match", ToastStyles);
      return;
    }

    setUpdatingPassword(true);
    try {
      const response = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: currentPassword || undefined,
          newPassword,
        }),
      });
      const data = await response.json();

      if (response.ok) {
        toast.success("Password changed successfully!", ToastStyles);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(data.error || "Failed to change password", ToastStyles);
      }
    } catch (err) {
      console.error("Password update error:", err);
      toast.error("Network error while updating password", ToastStyles);
    } finally {
      setUpdatingPassword(false);
    }
  };

  // Handle Account Deletion
  const handleDeleteAccount = async () => {
    if (deleteConfirmEmail !== originalEmail) {
      toast.error("Email verification incorrect", ToastStyles);
      return;
    }

    setDeletingAccount(true);
    try {
      const response = await fetch("/api/user", {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Account deleted. Logging out...", ToastStyles);
        // Clear cookies/session and redirect to home login
        signOut({ callbackUrl: "/login" });
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to delete account", ToastStyles);
        setDeletingAccount(false);
      }
    } catch (err) {
      console.error("Account deletion error:", err);
      toast.error("Network error while deleting account", ToastStyles);
      setDeletingAccount(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-base-content tracking-tight">
          Account Settings
        </h2>
        <p className="text-sm text-base-content/70 mt-1">
          Manage your account profile details, change passwords, and configure credentials.
        </p>
      </div>

      {loadingSession ? (
        <div className="flex flex-col gap-6">
          <div className="h-48 bg-base-200 rounded-2xl animate-pulse"></div>
          <div className="h-48 bg-base-200 rounded-2xl animate-pulse"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 items-start">
          {/* Profile Details & Password Changes */}
          <div className="space-y-8">
            {/* Profile Info Form */}
            <div className="card bg-base-200 border border-base-300 shadow-sm">
              <div className="card-body p-6">
                <div className="flex items-center gap-2 mb-4">
                  <User className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-bold text-base-content">Profile Details</h3>
                </div>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold text-base-content/80">Display Name</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="input input-bordered w-full"
                      required
                    />
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold text-base-content/80">Email Address</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input input-bordered w-full"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm w-fit font-bold mt-2"
                    disabled={updatingProfile}
                  >
                    {updatingProfile ? (
                      <span className="loading loading-spinner loading-xs"></span>
                    ) : (
                      "Update Profile"
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Change Password Form */}
            <div className="card bg-base-200 border border-base-300 shadow-sm">
              <div className="card-body p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Lock className="w-5 h-5 text-secondary" />
                  <h3 className="text-lg font-bold text-base-content">Change Password</h3>
                </div>
                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold text-base-content/80">Current Password</span>
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="input input-bordered w-full"
                    />
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold text-base-content/80">New Password</span>
                    </label>
                    <input
                      type="password"
                      placeholder="Min 8 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="input input-bordered w-full"
                      required
                    />
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold text-base-content/80">Confirm New Password</span>
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="input input-bordered w-full"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn btn-secondary btn-sm w-fit font-bold mt-2"
                    disabled={updatingPassword}
                  >
                    {updatingPassword ? (
                      <span className="loading loading-spinner loading-xs"></span>
                    ) : (
                      "Change Password"
                    )}
                  </button>
                </form>
              </div>
            </div>
            {/* Danger Zone */}
            <div className="space-y-0">
              <div className="card bg-base-200 border border-error/20 shadow-sm">
                <div className="card-body p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertOctagon className="w-5 h-5 text-error" />
                    <h3 className="text-lg font-bold text-base-content">Danger Zone</h3>
                  </div>
                  <p className="text-sm text-base-content/70 leading-relaxed">
                    Permanently delete your account, saved subtopics, pinned source domains, scheduled configurations, and all historical newsletter logs. This action is irreversible.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteConfirmEmail("");
                      setShowDeleteModal(true);
                    }}
                    className="btn btn-error text-error-content btn-sm font-bold w-fit shadow-md shadow-error/15 mt-4"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop overlay */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setShowDeleteModal(false)}
          />

          {/* Modal card */}
          <div className="relative w-full max-w-md bg-base-200 border border-base-300 rounded-2xl shadow-xl overflow-hidden p-6 z-10 animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="absolute top-4 right-4 btn btn-ghost btn-circle btn-sm text-base-content/60 hover:text-base-content"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex flex-col items-center text-center mt-2">
              <div className="p-3.5 bg-error/15 text-error rounded-2xl mb-4">
                <AlertOctagon className="w-8 h-8" />
              </div>

              <h3 className="text-xl font-bold text-base-content">Delete Account Permanently?</h3>

              <p className="text-xs text-base-content/75 mt-3 leading-relaxed">
                This will delete your agent subscription parameters, search preferences, and newsletter archives.
              </p>
              
              <div className="w-full mt-4 text-left">
                <label className="label p-1">
                  <span className="label-text text-xs font-semibold text-base-content/80">
                    Type your email <span className="font-bold select-all text-base-content">{originalEmail}</span> to confirm:
                  </span>
                </label>
                <input
                  type="text"
                  placeholder={originalEmail}
                  value={deleteConfirmEmail}
                  onChange={(e) => setDeleteConfirmEmail(e.target.value)}
                  className="input input-bordered input-sm w-full font-mono text-xs"
                />
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 w-full mt-6">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 btn btn-ghost border border-base-300 hover:bg-base-300 btn-sm"
                  disabled={deletingAccount}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmEmail !== originalEmail || deletingAccount}
                  className="flex-1 btn btn-error text-error-content btn-sm font-bold shadow-md shadow-error/15 disabled:bg-base-300 disabled:text-base-content/30 disabled:border-none"
                >
                  {deletingAccount ? (
                    <span className="loading loading-spinner loading-xs"></span>
                  ) : (
                    "Confirm Delete"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
