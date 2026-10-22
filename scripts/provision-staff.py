"""Provision an explicitly reviewed BellaPDV employee and bind to an existing professional.

Requires trusted Firebase Application Default Credentials and firebase-admin.
Dry-run (no writes):
  python3 scripts/provision-staff.py --owner-email owner@example.com \
    --staff-email employee@example.com --professional-id PROF_ID
Apply only after comparing printed UIDs and obtaining the company owner's approval:
  python3 scripts/provision-staff.py --owner-email owner@example.com \
    --staff-email employee@example.com --professional-id PROF_ID \
    --owner-uid OWNER_UID --staff-uid STAFF_UID --apply

This script does not create identities or send invitations. Employees must have an
already verified Firebase Auth account and the owner must explicitly authorize the
association. It never grants tenant-wide reads or platform administrator claims.
"""

import argparse
import sys

PROJECT_ID = "bellapdv-15ae0"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--owner-email", required=True)
    parser.add_argument("--staff-email", required=True)
    parser.add_argument("--professional-id", required=True)
    parser.add_argument("--owner-uid")
    parser.add_argument("--staff-uid")
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    if args.apply and (not args.owner_uid or not args.staff_uid):
        parser.error("--apply requires explicitly reviewed --owner-uid and --staff-uid")

    import firebase_admin
    from firebase_admin import auth, credentials, firestore

    firebase_admin.initialize_app(credentials.ApplicationDefault(), {"projectId": PROJECT_ID})
    owner = auth.get_user_by_email(args.owner_email.strip().lower())
    staff = auth.get_user_by_email(args.staff_email.strip().lower())
    for account, given_email in ((owner, args.owner_email), (staff, args.staff_email)):
        if account.disabled or not account.email_verified or account.email != given_email.strip().lower():
            raise RuntimeError("Owner and employee must both have active, verified email identities")
    if owner.uid == staff.uid:
        raise RuntimeError("Owner may not be provisioned as their own employee")
    if (args.owner_uid and args.owner_uid != owner.uid) or (args.staff_uid and args.staff_uid != staff.uid):
        raise RuntimeError("Reviewed UID mismatch — aborting")
    db = firestore.client()
    owner_doc = db.collection("users").document(owner.uid).get()
    staff_ref = db.collection("users").document(staff.uid)
    staff_doc = staff_ref.get()
    professional_doc = db.collection("professionals").document(args.professional_id).get()
    if not owner_doc.exists or owner_doc.to_dict().get("companyId") != owner.uid:
        raise RuntimeError("Owner does not own this tenant")
    if not staff_doc.exists:
        raise RuntimeError("Staff must first register a verified Firebase account")
    profile = staff_doc.to_dict()
    if profile.get("role") not in ("client", "employee"):
        raise RuntimeError("Staff account has a privileged or unsupported role")
    if profile.get("companyId") not in (staff.uid, owner.uid):
        raise RuntimeError("Staff profile belongs to a different company")
    if not professional_doc.exists or professional_doc.to_dict().get("ownerId") != owner.uid:
        raise RuntimeError("Professional record does not belong to the reviewed owner")
    claims = dict(staff.custom_claims or {})
    if claims.get("admin") or claims.get("platformAdmin") or claims.get("isPlatformAdmin"):
        raise RuntimeError("Privileged Firebase account cannot become an employee")
    if claims.get("companyId") not in (None, owner.uid):
        raise RuntimeError("Existing company claim points to another tenant")
    member_ref = db.collection("staff_members").document(staff.uid)
    member = member_ref.get()
    if member.exists and member.to_dict().get("companyId") != owner.uid:
        raise RuntimeError("Employee is already bound to another tenant")
    print(f"Project: {PROJECT_ID}\nOwner: {owner.email} ({owner.uid})")
    print(f"Staff: {staff.email} ({staff.uid})\nProfessional: {args.professional_id}")
    if not args.apply:
        print("DRY RUN: No records or claims have been altered.")
        return 0

    # Fail closed: mark as employee and inactive BEFORE altering tenant claims.
    batch = db.batch()
    batch.set(staff_ref, {"companyId": owner.uid, "role": "employee"}, merge=True)
    batch.set(member_ref, {
        "companyId": owner.uid,
        "professionalId": args.professional_id,
        "role": "professional",
        "active": False,
        "name": professional_doc.to_dict().get("name") or staff.display_name or "Profissional",
    }, merge=True)
    batch.commit()
    auth.set_custom_user_claims(staff.uid, {**claims, "companyId": owner.uid})
    updated = auth.get_user(staff.uid)
    if (updated.custom_claims or {}).get("companyId") != owner.uid:
        raise RuntimeError("Claim verification failed. Member remains inactive.")
    member_ref.update({"active": True})
    print("Employee provisioned. Staff must refresh their Firebase ID token.")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as exc:
        print(f"Error: {exc}", file=sys.stderr)
        sys.exit(1)
