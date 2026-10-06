"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { getFitbitAuthUrl } from "@/lib/fitbit";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  UserIcon,
  SmartphoneIcon,
  HeartIcon,
  SaveIcon,
  PhoneIcon,
  PlusIcon,
  TrashIcon,
  CheckCircleIcon,
  AlertCircleIcon,
} from "lucide-react";

interface Contact {
  id: string;
  name: string;
  phone: string;
  relationship: string | null;
  notification_method: "sms" | "call" | "app_notification";
  created_at: string;
}

interface HealthDevice {
  name: string;
  connected: boolean;
  description: string;
  icon: React.ReactNode;
}

export default function ProfilePage() {
  const { user, profile, loading: authLoading } = useAuth();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [medicalConditions, setMedicalConditions] = useState("");
  const [allergies, setAllergies] = useState("");
  const [bloodType, setBloodType] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactsLoading, setContactsLoading] = useState(true);
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContactName, setNewContactName] = useState("");
  const [newContactPhone, setNewContactPhone] = useState("");
  const [newContactRelationship, setNewContactRelationship] = useState("");

  const targetUserId = profile?.id || user?.id;

  const fetchContacts = useCallback(async () => {
    if (!targetUserId) return;

    setContactsLoading(true);
    const { data, error } = await supabase
      .from("emergency_contacts")
      .select("*")
      .eq("user_id", targetUserId)
      .order("created_at", { ascending: false });

    if (!error) setContacts(data || []);
    setContactsLoading(false);
  }, [targetUserId]);

  const populateForm = useCallback(
    (p: NonNullable<typeof profile>) => {
      setFullName(p.full_name || "");
      setPhone(p.phone || "");
      setMedicalConditions(p.medical_conditions || "");
      setAllergies(p.allergies || "");
      setBloodType(p.blood_type || "");
      setEmergencyContactName(p.emergency_contact_name || "");
      setEmergencyContactPhone(p.emergency_contact_phone || "");
    },
    []
  );

  useEffect(() => {
    if (profile) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      populateForm(profile);
    }
  }, [profile, populateForm]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchContacts();
  }, [fetchContacts]);

  const handleSave = async () => {
    if (!targetUserId) return;

    setSaving(true);
    setSaved(false);

    const { error } = await supabase
      .from("profiles")
      .upsert({
        id: targetUserId,
        full_name: fullName,
        phone,
        medical_conditions: medicalConditions || null,
        allergies: allergies || null,
        blood_type: bloodType || null,
        emergency_contact_name: emergencyContactName || null,
        emergency_contact_phone: emergencyContactPhone || null,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      alert("Failed to save profile: " + error.message);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }

    setSaving(false);
  };

  const handleAddContact = async () => {
    if (!profile?.id || !newContactName || !newContactPhone) return;

    const { error } = await supabase.from("emergency_contacts").insert({
      user_id: profile.id,
      name: newContactName,
      phone: newContactPhone,
      relationship: newContactRelationship || null,
    });

    if (error) {
      alert("Failed to add contact: " + error.message);
    } else {
      fetchContacts();
      setShowAddContact(false);
      setNewContactName("");
      setNewContactPhone("");
      setNewContactRelationship("");
    }
  };

  const handleDeleteContact = async (id: string) => {
    if (!confirm("Remove this emergency contact?")) return;

    const { error } = await supabase
      .from("emergency_contacts")
      .delete()
      .eq("id", id)
      .eq("user_id", profile?.id);

    if (error) {
      alert("Failed to delete: " + error.message);
    } else {
      fetchContacts();
    }
  };

  const handleConnectFitbit = () => {
    const authUrl = getFitbitAuthUrl(
      `${window.location.origin}/api/fitbit/callback`
    );
    window.location.href = authUrl;
  };

  const healthDevices: HealthDevice[] = [
    {
      name: "Fitbit",
      connected: !!profile?.fitbit_access_token,
      description: "Heart rate, steps, live location",
      icon: <SmartphoneIcon className="h-5 w-5" />,
    },
    {
      name: "Apple Health",
      connected: !!profile?.smartwatch_connected,
      description: "Vitals & location via iPhone watch",
      icon: <HeartIcon className="h-5 w-5" />,
    },
    {
      name: "Google Fit",
      connected: false,
      description: "Step count & heart rate from Android",
      icon: <HeartIcon className="h-5 w-5" />,
    },
  ];

  if (authLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-pulse py-6">
        <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-1/3 mb-6" />
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-6 space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-1/4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded" />
            <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Profile header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Profile & Settings</h1>
        {saved && (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircleIcon className="h-5 w-5" />
            <span className="text-sm font-medium">Saved!</span>
          </div>
        )}
      </div>

      {/* Personal info */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <UserIcon className="h-5 w-5" />
          Personal Information
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="John Doe"
          />
          <Input
            label="Phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 (555) 123-4567"
          />
          <Input
            label="Medical conditions"
            value={medicalConditions}
            onChange={(e) => setMedicalConditions(e.target.value)}
            placeholder="Diabetes, Hypertension..."
            className="md:col-span-2"
          />
          <Input
            label="Allergies"
            value={allergies}
            onChange={(e) => setAllergies(e.target.value)}
            placeholder="Penicillin, Peanuts..."
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Blood type
            </label>
            <select
              value={bloodType}
              onChange={(e) => setBloodType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select blood type</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
            </select>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t">
          <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <PhoneIcon className="h-4 w-4" />
            Emergency Contact
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Contact name"
              value={emergencyContactName}
              onChange={(e) => setEmergencyContactName(e.target.value)}
              placeholder="Jane Doe"
            />
            <Input
              label="Contact phone"
              value={emergencyContactPhone}
              onChange={(e) => setEmergencyContactPhone(e.target.value)}
              placeholder="+1 (555) 987-6543"
            />
          </div>
        </div>

        <Button
          variant="primary"
          className="mt-6"
          onClick={handleSave}
          loading={saving}
        >
          <SaveIcon className="h-4 w-4 mr-2" />
          Save Profile
        </Button>
      </div>

      {/* Emergency contacts list */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Emergency Contacts</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddContact(!showAddContact)}
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Add Contact
          </Button>
        </div>

        {showAddContact && (
          <div className="mb-4 p-4 border border-gray-200 rounded-lg space-y-3">
            <Input
              label="Name"
              placeholder="Contact name"
              value={newContactName}
              onChange={(e) => setNewContactName(e.target.value)}
            />
            <Input
              label="Phone"
              placeholder="+1 (555) 123-4567"
              value={newContactPhone}
              onChange={(e) => setNewContactPhone(e.target.value)}
            />
            <Input
              label="Relationship"
              placeholder="Spouse, Parent, Sibling..."
              value={newContactRelationship}
              onChange={(e) => setNewContactRelationship(e.target.value)}
            />
            <div className="flex gap-2">
              <Button variant="primary" size="sm" onClick={handleAddContact}>
                Add
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowAddContact(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {contactsLoading ? (
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : contacts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <PhoneIcon className="h-10 w-10 mx-auto mb-2 text-gray-300" />
            <p>No emergency contacts saved yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {contacts.map((contact) => (
              <div key={contact.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <UserIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">{contact.name}</p>
                    <p className="text-sm text-gray-600">{contact.phone}</p>
                    {contact.relationship && (
                      <p className="text-xs text-gray-500">{contact.relationship}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteContact(contact.id)}
                  className="text-red-600 hover:text-red-700 p-1"
                  title="Remove contact"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Health device connections */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <HeartIcon className="h-5 w-5 text-red-500" />
          Connected Health Devices
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Connect your Fitbit, Apple Watch, or other health devices to
          automatically share live location and vital signs during emergencies.
        </p>

        <div className="space-y-4">
          {healthDevices.map((device) => (
            <div
              key={device.name}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg ${
                    device.connected ? "bg-green-100" : "bg-gray-100"
                  }`}
                >
                  {device.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-900">{device.name}</h3>
                    {device.connected ? (
                      <CheckCircleIcon className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircleIcon className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{device.description}</p>
                </div>
              </div>

              {device.name === "Fitbit" ? (
                device.connected ? (
                  <span className="text-sm text-green-600 font-medium">Connected</span>
                ) : (
                  <Button size="sm" onClick={handleConnectFitbit}>
                    Connect
                  </Button>
                )
              ) : (
                <Button size="sm" variant={device.connected ? "secondary" : "outline"} disabled>
                  {device.connected ? "Connected" : "Coming Soon"}
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
