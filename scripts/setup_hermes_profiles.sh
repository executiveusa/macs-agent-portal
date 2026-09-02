for profile in chief-pup superdoer business-pup; do
  profile_dir="/opt/data/profiles/$profile"
  mkdir -p "$profile_dir"
  if [ -f "/opt/maxx-seed/profile/pups/$profile/SOUL.md" ]; then
    cp "/opt/maxx-seed/profile/pups/$profile/SOUL.md" "$profile_dir/SOUL.md"
  fi
  derived_key=$(python3 -c "import hashlib, hmac, os; print(hmac.new(os.environ.get('API_SERVER_KEY', '').encode(), f'maxx-hermes-profile:${profile}'.encode(), hashlib.sha256).hexdigest())")
  touch "$profile_dir/.env"
  grep -v '^API_SERVER_KEY=' "$profile_dir/.env" > "$profile_dir/.env.tmp" 2>/dev/null || true
  echo "API_SERVER_KEY=$derived_key" >> "$profile_dir/.env.tmp"
  mv "$profile_dir/.env.tmp" "$profile_dir/.env"
  echo "Configured $profile with derived key"
done
chown -R 1000:1000 /opt/data/profiles
