"""Grant BellaPDV platform access to a verified, explicitly approved Firebase user.

Run in a trusted environment with Application Default Credentials and firebase-admin:
    python3 -m pip install --user firebase-admin
    python3 scripts/grant-super-admin.py --email tramposshop@gmail.com
    python3 scripts/grant-super-admin.py --email tramposshop@gmail.com --uid <reviewed-uid> --apply

The first command only prints the account and its existing claims. Review the UID
before running --apply. This script never takes a service account key as input.
"""

import argparse
import sys

PROJECT_ID = "bellapdv-15ae0"
ALLOWED_EMAILS = {"tramposshop@gmail.com", "agtramposof@gmail.com"}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--email", required=True, choices=sorted(ALLOWED_EMAILS))
    parser.add_argument("--uid", help="UID shown in the dry run; required with --apply")
    parser.add_argument("--apply", action="store_true", help="Write the admin custom claim")
    args = parser.parse_args()
    if args.apply and not args.uid:
        parser.error("--apply requires the UID reviewed in a dry run")

    import firebase_admin
    from firebase_admin import auth, credentials

    firebase_admin.initialize_app(credentials.ApplicationDefault(), {"projectId": PROJECT_ID})
    user = auth.get_user_by_email(args.email)
    if user.email != args.email or not user.email_verified or user.disabled:
        raise RuntimeError("Account email must match exactly, be verified, and be enabled")
    if args.uid and args.uid != user.uid:
        raise RuntimeError("UID does not match the reviewed account")

    claims = dict(user.custom_claims or {})
    print(f"Project: {PROJECT_ID}\nEmail: {user.email}\nUID: {user.uid}")
    print(f"Existing claims: {claims}")
    if not args.apply:
        print("Dry run only. Use --uid <UID> --apply after reviewing this account.")
        return 0
    if claims.get("admin") is True:
        print("Already active; no change made.")
        return 0

    auth.set_custom_user_claims(user.uid, {**claims, "admin": True})
    updated = auth.get_user(user.uid)
    if (updated.custom_claims or {}).get("admin") is not True:
        raise RuntimeError("Claim verification failed")
    print("Verified: admin=true. User should sign out and back in to refresh the token.")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as exc:
        print(f"Error: {exc}", file=sys.stderr)
        sys.exit(1)
