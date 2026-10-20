"""Assign a verified collaborator's companyId claim without replacing existing claims.

Requires firebase-admin and Application Default Credentials for bellapdv-15ae0.
First inspect the accounts (read only):
  python3 scripts/assign-company-claim.py --email staff@example.com --owner-email owner@example.com
Then apply using both UIDs returned by the dry run:
  python3 scripts/assign-company-claim.py --email staff@example.com --owner-email owner@example.com \
    --uid STAFF_UID --owner-uid OWNER_UID --apply

Both accounts need verified emails and matching Firestore user profiles. The owner's
profile must own its own tenant; the collaborator profile must name that tenant.
"""

import argparse
import sys

PROJECT_ID = "bellapdv-15ae0"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--email", required=True, help="Existing collaborator email")
    parser.add_argument("--owner-email", required=True, help="Existing company owner email")
    parser.add_argument("--uid", help="Reviewed collaborator UID; required with --apply")
    parser.add_argument("--owner-uid", help="Reviewed owner UID; required with --apply")
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    if args.apply and (not args.uid or not args.owner_uid):
        parser.error("--apply requires both reviewed UIDs")

    import firebase_admin
    from firebase_admin import auth, credentials, firestore

    firebase_admin.initialize_app(credentials.ApplicationDefault(), {"projectId": PROJECT_ID})
    staff = auth.get_user_by_email(args.email.strip().lower())
    owner = auth.get_user_by_email(args.owner_email.strip().lower())
    for account, supplied_email in ((staff, args.email), (owner, args.owner_email)):
        if account.email != supplied_email.strip().lower() or not account.email_verified or account.disabled:
            raise RuntimeError("Both accounts must be enabled and have matching verified emails")
    if staff.uid == owner.uid:
        raise RuntimeError("Collaborator and owner must be different accounts")
    if (args.uid and args.uid != staff.uid) or (args.owner_uid and args.owner_uid != owner.uid):
        raise RuntimeError("Reviewed UID does not match the current Firebase account")

    db = firestore.client()
    owner_profile = db.collection("users").document(owner.uid).get()
    staff_profile = db.collection("users").document(staff.uid).get()
    if not owner_profile.exists or owner_profile.to_dict().get("companyId") != owner.uid:
        raise RuntimeError("Owner profile must exist and own its tenant")
    if not staff_profile.exists or staff_profile.to_dict().get("companyId") != owner.uid:
        raise RuntimeError("Collaborator profile must belong to the reviewed owner's tenant")

    claims = dict(staff.custom_claims or {})
    if claims.get("companyId") not in (None, owner.uid):
        raise RuntimeError("Existing companyId claim points to another tenant; review manually")
    print(f"Project: {PROJECT_ID}\nCollaborator: {staff.email} ({staff.uid})")
    print(f"Owner: {owner.email} ({owner.uid})\nExisting claims: {claims}")
    if not args.apply:
        print("Dry run only. Review the UIDs before applying.")
        return 0
    if claims.get("companyId") == owner.uid:
        print("Claim already matches; no change made.")
        return 0

    auth.set_custom_user_claims(staff.uid, {**claims, "companyId": owner.uid})
    updated = auth.get_user(staff.uid)
    if (updated.custom_claims or {}).get("companyId") != owner.uid:
        raise RuntimeError("Claim verification failed")
    print("Verified companyId claim. Collaborator must refresh their ID token.")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as exc:
        print(f"Error: {exc}", file=sys.stderr)
        sys.exit(1)
