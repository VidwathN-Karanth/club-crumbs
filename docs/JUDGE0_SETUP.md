# Free self-hosted judge (Oracle Cloud + Judge0)

The Coding feature runs student code on a **judge** — a sandboxed service that
compiles and runs a submission against test cases and returns a verdict. Club
Crumbs never runs code itself; it calls the judge over HTTP.

This guide stands up **Judge0 CE** on an **Oracle Cloud "Always Free"** VM — a
server that is free *forever* (not a trial). Total cost: **₹0 / $0**.

The app talks to the judge through one env var, so nothing here is baked into
the code — you can move or replace the judge later by changing `JUDGE0_URL`.

---

## 0. The one gotcha to know first

Judge0's official Docker images are **x86‑64 (amd64) only**. Oracle's *roomiest*
free shape is ARM (Ampere). So:

- **Use the free x86 shape: `VM.Standard.E2.1.Micro`** (1 GB RAM, amd64). We add
  swap to make 1 GB comfortable for a club‑sized contest.
- If you would rather use the big ARM instance (Ampere A1, up to 24 GB), tell me
  and we switch the judge to **Piston**, which runs natively on ARM — the app
  supports both behind the same adapter.

---

## 1. Create the Oracle Cloud account

1. Go to <https://www.oracle.com/cloud/free/> → **Start for free**.
2. Sign up. A card is required for identity verification but **Always‑Free
   resources are never charged**. Pick a home region close to you (e.g. Mumbai /
   Hyderabad for India).

## 2. Create the VM

1. Console → **Compute → Instances → Create instance**.
2. **Image:** Canonical **Ubuntu 22.04**.
3. **Shape:** Change shape → **Ampere?** no → **Specialty and previous
   generation** → **VM.Standard.E2.1.Micro** (marked *Always Free eligible*).
4. **Networking:** keep the default VCN/subnet; **assign a public IPv4**.
5. **SSH keys:** download the private key (you'll SSH with it). Save it safely.
6. **Create.** Note the **public IP** once it's running.

## 3. Open the judge port

Two layers of firewall must allow TCP **2358** (Judge0's port).

**a) Oracle Security List:** Console → your instance → **Virtual Cloud Network →
Security Lists → Default** → **Add Ingress Rule**:
- Source CIDR `0.0.0.0/0`, IP protocol **TCP**, destination port **2358**.
  (We protect the API with an auth token in step 6; optionally restrict the CIDR
  later.)

**b) On the VM** (after you SSH in, step 4):
```bash
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 2358 -j ACCEPT
sudo netfilter-persistent save
```

## 4. SSH in

```bash
chmod 600 your-key.pem
ssh -i your-key.pem ubuntu@YOUR_PUBLIC_IP
```

## 5. Prepare the host

```bash
# Docker + Compose
sudo apt-get update && sudo apt-get -y install docker.io docker-compose-v2
sudo usermod -aG docker ubuntu && newgrp docker

# 2 GB swap so the 1 GB instance never OOMs while judging
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Judge0's isolate sandbox needs cgroup v1
sudo sed -i 's/GRUB_CMDLINE_LINUX="\(.*\)"/GRUB_CMDLINE_LINUX="\1 systemd.unified_cgroup_hierarchy=0"/' /etc/default/grub
sudo update-grub && sudo reboot
```
SSH back in after the reboot.

## 6. Run Judge0

```bash
mkdir ~/judge0 && cd ~/judge0
wget https://github.com/judge0/judge0/releases/download/v1.13.1/judge0-v1.13.1.zip
unzip judge0-v1.13.1.zip && cd judge0-v1.13.1

# Set a strong auth token so only Club Crumbs can call the judge.
TOKEN=$(openssl rand -hex 24)
sed -i "s/^# AUTHN_TOKEN=.*/AUTHN_TOKEN=$TOKEN/" judge0.conf
echo "YOUR JUDGE0 TOKEN (save this): $TOKEN"

# Start db + redis first, then the app (documented startup order)
docker compose up -d db redis
sleep 10
docker compose up -d
sleep 5
```

Test it (replace TOKEN):
```bash
curl -s "http://localhost:2358/languages" -H "X-Auth-Token: $TOKEN" | head
```
You should get a JSON list of languages. From your laptop, the same call to
`http://YOUR_PUBLIC_IP:2358/languages` should also work.

## 7. Give the values to Club Crumbs

Add these to **Vercel → club-crumbs → Settings → Environment Variables** (and to
your local `.env.local`), then redeploy:

```
JUDGE0_URL=http://YOUR_PUBLIC_IP:2358
JUDGE0_AUTH_TOKEN=the-token-from-step-6
```

That's it — the app will route every Run and Submit to your free judge.

---

## Optional hardening (later)
- Put the judge behind HTTPS with Caddy (`judge.yourdomain` → `:2358`) so the
  token never crosses plain HTTP.
- Restrict the 2358 ingress CIDR once you know your callers.
- Judge0 config knobs worth setting in `judge0.conf`: `MAX_QUEUE_SIZE`,
  `MAX_CPU_TIME_LIMIT`, `MAX_MEMORY_LIMIT` — the app also sends per‑problem
  limits on each submission.

## If 1 GB feels tight
Switch to the Ampere ARM Always‑Free instance and tell me — I'll point the
adapter at **Piston** (native ARM, single container), no app rewrite.
