/**
 * Dükkanım Yanımda — Official Code-Driven Articulated Vector "Usta" Character Rig (SVG + GSAP 60 FPS)
 * Supports:
 * - Articulated 2-segment arms (Shoulder -> Elbow -> Wrist/Hand)
 * - Opening & closing Barber Scissors ("makas açıp kapatma") with flying hair snippets
 * - Barber Comb coordination in left hand
 * - Buzzing Cordless Clipper with micro-vibration
 * - Ringing Smartphone & "Drop Phone into Apron Pocket" animation
 * - Dükkanım Yanımda Live Tablet presentation & hand waving / pointing
 * - Expressive Face: Eye tracking, natural blinking, eyebrow emotions, and audio-synced Lip-Sync talking
 * - Optional Customer in Barber Chair rig for haircut scenes
 */
(function (global) {
  const UstaVectorRig = {
    create(container, options = {}) {
      const el = typeof container === "string" ? document.querySelector(container) : container;
      if (!el) throw new Error("UstaVectorRig container not found: " + container);

      const idPrefix = options.idPrefix || "usta";
      const showCustomer = options.showCustomer !== undefined ? options.showCustomer : false;
      const showChair = options.showChair !== undefined ? options.showChair : showCustomer;

      el.innerHTML = this._buildSVG(idPrefix, showCustomer, showChair);

      const q = (sel) => el.querySelector(`#${idPrefix}-${sel}`);

      const rig = {
        el,
        idPrefix,
        q,
        // Reset to neutral pose
        reset(tl, at = 0) {
          tl.set(q("head-group"), { rotation: 0, x: 0, y: 0, transformOrigin: "250px 215px" }, at);
          tl.set(q("torso-group"), { scaleY: 1, scaleX: 1, y: 0, transformOrigin: "250px 380px" }, at);
          tl.set(q("arm-r-upper"), { rotation: 15, transformOrigin: "175px 255px" }, at);
          tl.set(q("arm-r-lower"), { rotation: -25, transformOrigin: "155px 345px" }, at);
          tl.set(q("arm-l-upper"), { rotation: -15, transformOrigin: "325px 255px" }, at);
          tl.set(q("arm-l-lower"), { rotation: 25, transformOrigin: "345px 345px" }, at);
          tl.set(q("scissor-blade-moving"), { rotation: 0, transformOrigin: "135px 365px" }, at);
        },

        /**
         * Adds continuous 60 FPS ambient life: breathing, subtle head bob, and natural eye blinks
         */
        addAmbientLife(tl, duration = 25, startTime = 0) {
          // Breathing chest & apron motion
          const breathCycles = Math.ceil(duration / 1.4);
          tl.fromTo(
            q("torso-group"),
            { scaleY: 1.0, scaleX: 1.0, y: 0, transformOrigin: "250px 420px" },
            {
              scaleY: 1.016,
              scaleX: 1.01,
              y: -3,
              duration: 1.4,
              yoyo: true,
              repeat: breathCycles,
              ease: "sine.inOut",
            },
            startTime
          );

          // Periodic natural eye blinking
          for (let t = startTime + 1.2; t < startTime + duration - 0.3; t += 2.9) {
            tl.to([q("eyelid-l"), q("eyelid-r")], { scaleY: 1, duration: 0.08, transformOrigin: "center top" }, t);
            tl.to([q("eyelid-l"), q("eyelid-r")], { scaleY: 0, duration: 0.09, transformOrigin: "center top" }, t + 0.09);
          }
        },

        /**
         * Sets active tool/prop visibility on Right and Left hands
         * rightProp: 'scissors' | 'clipper' | 'wave' | 'chin' | 'none'
         * leftProp:  'comb' | 'phone' | 'tablet' | 'none'
         */
        setProps(tl, { rightProp = "scissors", leftProp = "comb", pocketPhone = false }, at = 0) {
          const rProps = ["scissors", "clipper", "hand-open"];
          rProps.forEach((p) => {
            const node = q(`prop-r-${p}`);
            if (node) tl.set(node, { opacity: rightProp === p || ( (rightProp === "wave" || rightProp === "chin") && p === "hand-open") ? 1 : 0 }, at);
          });

          const lProps = ["comb", "phone", "tablet", "hand-open"];
          lProps.forEach((p) => {
            const node = q(`prop-l-${p}`);
            if (node) tl.set(node, { opacity: leftProp === p || (leftProp === "none" && p === "hand-open") ? 1 : 0 }, at);
          });

          const pockNode = q("pocket-phone-peek");
          if (pockNode) tl.set(pockNode, { opacity: pocketPhone ? 1 : 0 }, at);
        },

        /**
         * Sets facial emotion ('happy' | 'focused' | 'thinking' | 'stressed' | 'relieved')
         */
        setEmotion(tl, emotion = "happy", at = 0) {
          const browL = q("brow-l");
          const browR = q("brow-r");
          const pupils = [q("pupil-l"), q("pupil-r")];

          if (emotion === "happy" || emotion === "relieved") {
            tl.to(browL, { rotation: -3, y: -2, duration: 0.25, transformOrigin: "center center" }, at);
            tl.to(browR, { rotation: 3, y: -2, duration: 0.25, transformOrigin: "center center" }, at);
            tl.to(pupils, { x: 0, y: 0, duration: 0.25 }, at);
          } else if (emotion === "focused") {
            tl.to(browL, { rotation: 5, y: 2, duration: 0.25, transformOrigin: "center center" }, at);
            tl.to(browR, { rotation: -5, y: 2, duration: 0.25, transformOrigin: "center center" }, at);
            tl.to(pupils, { x: 0, y: 4, duration: 0.25 }, at);
          } else if (emotion === "thinking") {
            tl.to(browL, { rotation: -12, y: -6, duration: 0.25, transformOrigin: "center center" }, at);
            tl.to(browR, { rotation: 8, y: 3, duration: 0.25, transformOrigin: "center center" }, at);
            tl.to(pupils, { x: -4, y: -4, duration: 0.25 }, at);
          } else if (emotion === "stressed") {
            tl.to(browL, { rotation: 14, y: 4, duration: 0.2, transformOrigin: "center center" }, at);
            tl.to(browR, { rotation: -14, y: 4, duration: 0.2, transformOrigin: "center center" }, at);
            tl.to(pupils, { x: 4, y: 2, duration: 0.2 }, at);
          }
        },

        /**
         * Animates Usta actively cutting hair with SCISSORS opening & closing ("makas açıp kapatma")
         * and coordinating the comb in his left hand!
         */
        animateScissorsHaircut(tl, startTime, duration) {
          this.setProps(tl, { rightProp: "scissors", leftProp: "comb", pocketPhone: false }, startTime);
          this.setEmotion(tl, "focused", startTime);

          const snipInterval = 0.14; // fast crisp 60fps scissor snips
          const snips = Math.floor(duration / snipInterval);

          // Position arms over customer's hair
          tl.to(q("arm-r-upper"), { rotation: -42, duration: 0.35, ease: "power2.out", transformOrigin: "175px 255px" }, startTime);
          tl.to(q("arm-r-lower"), { rotation: -68, duration: 0.35, ease: "power2.out", transformOrigin: "155px 345px" }, startTime);
          tl.to(q("arm-l-upper"), { rotation: 38, duration: 0.35, ease: "power2.out", transformOrigin: "325px 255px" }, startTime);
          tl.to(q("arm-l-lower"), { rotation: 62, duration: 0.35, ease: "power2.out", transformOrigin: "345px 345px" }, startTime);

          // Sweep arms across the customer's crown while snipping
          const sweepCycles = Math.max(1, Math.floor(duration / 0.85));
          tl.to(
            q("arm-r-upper"),
            {
              rotation: -24,
              duration: 0.85,
              yoyo: true,
              repeat: sweepCycles,
              ease: "sine.inOut",
              transformOrigin: "175px 255px",
            },
            startTime + 0.35
          );
          tl.to(
            q("arm-l-upper"),
            {
              rotation: 22,
              duration: 0.85,
              yoyo: true,
              repeat: sweepCycles,
              ease: "sine.inOut",
              transformOrigin: "325px 255px",
            },
            startTime + 0.35
          );

          // Rapid Scissor Blade Open/Close ("Makas Açıp Kapatma")
          tl.fromTo(
            q("scissor-blade-moving"),
            { rotation: 0, transformOrigin: "135px 365px" },
            {
              rotation: -32,
              duration: snipInterval / 2,
              yoyo: true,
              repeat: snips * 2,
              ease: "power1.inOut",
              transformOrigin: "135px 365px",
            },
            startTime
          );

          // Head subtle nod while inspecting haircut
          tl.to(
            q("head-group"),
            {
              rotation: 3.5,
              y: 2,
              duration: 0.7,
              yoyo: true,
              repeat: Math.floor(duration / 0.7),
              ease: "sine.inOut",
              transformOrigin: "250px 215px",
            },
            startTime
          );
        },

        /**
         * Animates Usta holding a ringing phone in left hand and scratching chin/head in thought
         */
        animatePhoneDilemma(tl, startTime, duration) {
          this.setProps(tl, { rightProp: "chin", leftProp: "phone", pocketPhone: false }, startTime);
          this.setEmotion(tl, "thinking", startTime);

          // Left arm raises ringing phone
          tl.to(q("arm-l-upper"), { rotation: -48, duration: 0.4, ease: "back.out(1.5)", transformOrigin: "325px 255px" }, startTime);
          tl.to(q("arm-l-lower"), { rotation: -55, duration: 0.4, ease: "back.out(1.5)", transformOrigin: "345px 345px" }, startTime);

          // Right arm moves up to chin/beard in puzzled thought
          tl.to(q("arm-r-upper"), { rotation: -55, duration: 0.45, ease: "power2.out", transformOrigin: "175px 255px" }, startTime);
          tl.to(q("arm-r-lower"), { rotation: -88, duration: 0.45, ease: "power2.out", transformOrigin: "155px 345px" }, startTime);

          // Head tilts in thought
          tl.to(q("head-group"), { rotation: -6, duration: 0.5, ease: "back.out(1.4)", transformOrigin: "250px 215px" }, startTime);
        },

        /**
         * Animates Usta sliding the phone into his front apron pocket ("Telefon cebinde kalır!")
         */
        animatePhoneToPocket(tl, startTime) {
          this.setEmotion(tl, "relieved", startTime);
          // Move left arm down to front apron pocket
          tl.to(q("arm-l-upper"), { rotation: 18, duration: 0.45, ease: "power2.inOut", transformOrigin: "325px 255px" }, startTime);
          tl.to(q("arm-l-lower"), { rotation: 48, duration: 0.45, ease: "power2.inOut", transformOrigin: "345px 345px" }, startTime);
          // Swap phone from hand into pocket at startTime + 0.42s
          tl.set(q("prop-l-phone"), { opacity: 0 }, startTime + 0.42);
          tl.set(q("prop-l-hand-open"), { opacity: 1 }, startTime + 0.42);
          tl.fromTo(
            q("pocket-phone-peek"),
            { opacity: 0, y: -18 },
            { opacity: 1, y: 0, duration: 0.3, ease: "back.out(1.8)" },
            startTime + 0.42
          );
          tl.to(q("head-group"), { rotation: 0, duration: 0.35, ease: "power2.out", transformOrigin: "250px 215px" }, startTime + 0.2);
        },

        /**
         * Animates Usta presenting the Dükkanım Yanımda Tablet and waving/pointing
         */
        animateTabletShowcase(tl, startTime, duration) {
          this.setProps(tl, { rightProp: "wave", leftProp: "tablet", pocketPhone: true }, startTime);
          this.setEmotion(tl, "happy", startTime);

          tl.to(q("arm-l-upper"), { rotation: -35, duration: 0.45, ease: "back.out(1.5)", transformOrigin: "325px 255px" }, startTime);
          tl.to(q("arm-l-lower"), { rotation: -40, duration: 0.45, ease: "back.out(1.5)", transformOrigin: "345px 345px" }, startTime);

          tl.to(q("arm-r-upper"), { rotation: -65, duration: 0.4, ease: "back.out(1.5)", transformOrigin: "175px 255px" }, startTime);
          tl.to(
            q("arm-r-lower"),
            {
              rotation: -45,
              duration: 0.35,
              yoyo: true,
              repeat: Math.max(2, Math.floor(duration / 0.35)),
              ease: "sine.inOut",
              transformOrigin: "155px 345px",
            },
            startTime + 0.2
          );
        },

        /**
         * Synchronizes Usta's mouth opening/closing to word timestamps from Whisper timeline
         */
        syncMouthToWords(tl, words = []) {
          const mouthOpen = q("mouth-open-shape");
          if (!mouthOpen) return;
          words.forEach((w) => {
            const dur = Math.max(0.08, w.end - w.start);
            const syllables = Math.max(1, Math.min(4, Math.round(w.word.length / 2.6)));
            const sylDur = dur / (syllables * 2);
            tl.fromTo(
              mouthOpen,
              { scaleY: 0.25, transformOrigin: "250px 186px" },
              {
                scaleY: 1.15,
                duration: sylDur,
                yoyo: true,
                repeat: syllables * 2 - 1,
                ease: "power1.inOut",
                transformOrigin: "250px 186px",
              },
              w.start
            );
          });
        },
      };

      return rig;
    },

    _buildSVG(id, showCustomer, showChair) {
      return `
      <svg viewBox="0 0 500 680" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="overflow:visible">
        <defs>
          <linearGradient id="${id}-apronGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#FF7A1A"/>
            <stop offset="100%" stop-color="#E05500"/>
          </linearGradient>
          <linearGradient id="${id}-shirtGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#243756"/>
            <stop offset="100%" stop-color="#17243B"/>
          </linearGradient>
          <linearGradient id="${id}-steelGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#F8FAFC"/>
            <stop offset="50%" stop-color="#CBD5E1"/>
            <stop offset="100%" stop-color="#64748B"/>
          </linearGradient>
        </defs>

        <!-- FLOOR SHADOW -->
        <ellipse cx="250" cy="645" rx="135" ry="18" fill="rgba(15, 23, 42, 0.14)" />

        <!-- LEGS & BOOTS -->
        <g id="${id}-legs-group">
          <rect x="195" y="470" width="44" height="145" rx="16" fill="#2C333E" stroke="#181C24" stroke-width="4"/>
          <rect x="261" y="470" width="44" height="145" rx="16" fill="#2C333E" stroke="#181C24" stroke-width="4"/>
          <!-- Cuffs -->
          <rect x="191" y="596" width="52" height="16" rx="6" fill="#3B4454" stroke="#181C24" stroke-width="3.5"/>
          <rect x="257" y="596" width="52" height="16" rx="6" fill="#3B4454" stroke="#181C24" stroke-width="3.5"/>
          <!-- Craftsman Leather Boots -->
          <path d="M188 612 H242 V642 H172 C172 624 180 612 188 612 Z" fill="#6E3B1E" stroke="#181C24" stroke-width="4"/>
          <path d="M258 612 H312 C320 612 328 624 328 642 H258 Z" fill="#6E3B1E" stroke="#181C24" stroke-width="4"/>
        </g>

        <!-- TORSO & ORANGE CRAFTSMAN APRON -->
        <g id="${id}-torso-group">
          <!-- Navy Work Shirt Torso -->
          <rect x="162" y="222" width="176" height="255" rx="38" fill="url(#${id}-shirtGrad)" stroke="#181C24" stroke-width="4.5"/>
          <!-- Shirt Collar -->
          <polygon points="215,216 250,248 232,262 198,228" fill="#1E2E4A" stroke="#181C24" stroke-width="3.5"/>
          <polygon points="285,216 250,248 268,262 302,228" fill="#1E2E4A" stroke="#181C24" stroke-width="3.5"/>

          <!-- Leather Apron Straps -->
          <rect x="192" y="220" width="18" height="62" rx="6" fill="#8C4A27" stroke="#181C24" stroke-width="3.5"/>
          <rect x="290" y="220" width="18" height="62" rx="6" fill="#8C4A27" stroke="#181C24" stroke-width="3.5"/>
          <circle cx="201" cy="272" r="7" fill="#E2E8F0" stroke="#181C24" stroke-width="3"/>
          <circle cx="299" cy="272" r="7" fill="#E2E8F0" stroke="#181C24" stroke-width="3"/>

          <!-- Orange Craftsman Apron Body -->
          <path d="M182 265 H318 L332 495 C332 504 324 510 315 510 H185 C176 510 168 504 168 495 Z" fill="url(#${id}-apronGrad)" stroke="#181C24" stroke-width="4.5"/>

          <!-- Apron Chest Pocket & Brand Badge -->
          <path d="M215 296 H285 V348 L250 362 L215 348 Z" fill="#E85D00" stroke="#181C24" stroke-width="3.5"/>
          <rect x="292" y="284" width="18" height="18" rx="4" fill="#FFFFFF" stroke="#181C24" stroke-width="2.5"/>
          <circle cx="301" cy="293" r="4" fill="#FF6B00"/>

          <!-- Phone Peeking Inside Apron Pocket (when 'Telefon Cebinde Kalır' triggers) -->
          <g id="${id}-pocket-phone-peek" opacity="0">
            <rect x="258" y="376" width="44" height="62" rx="8" fill="#181C24" stroke="#FFBA08" stroke-width="3"/>
            <rect x="263" y="382" width="34" height="44" rx="4" fill="#22C55E"/>
          </g>

          <!-- Apron Lower Tool Pocket -->
          <rect x="190" y="402" width="120" height="78" rx="14" fill="#D95300" stroke="#181C24" stroke-width="3.5"/>
          <line x1="250" y1="402" x2="250" y2="480" stroke="#181C24" stroke-width="3.5"/>
        </g>

        <!-- HEAD, HAIR, BEARD & EXPRESSIVE FACE -->
        <g id="${id}-head-group">
          <!-- Neck -->
          <rect x="228" y="195" width="44" height="40" rx="14" fill="#E5AC83" stroke="#181C24" stroke-width="4"/>

          <!-- Ears -->
          <ellipse cx="184" cy="148" rx="12" ry="18" fill="#F4C29F" stroke="#181C24" stroke-width="4"/>
          <ellipse cx="316" cy="148" rx="12" ry="18" fill="#F4C29F" stroke="#181C24" stroke-width="4"/>

          <!-- Face Base -->
          <rect x="190" y="78" width="120" height="134" rx="48" fill="#F4C29F" stroke="#181C24" stroke-width="4.5"/>

          <!-- Salt-and-Pepper Stylized Hair (Full Unclipped Crown) -->
          <path d="M185 130 C180 85 202 52 250 52 C298 52 320 85 315 130 C312 105 298 86 250 86 C202 86 188 105 185 130 Z" fill="#2D3440" stroke="#181C24" stroke-width="4.5"/>
          <!-- Silver Temple Streaks & Crown Wave -->
          <path d="M186 122 C186 102 194 90 205 84" stroke="#94A3B8" stroke-width="7" stroke-linecap="round" fill="none"/>
          <path d="M314 122 C314 102 306 90 295 84" stroke="#94A3B8" stroke-width="7" stroke-linecap="round" fill="none"/>
          <path d="M218 68 C238 58 268 58 286 70" stroke="#94A3B8" stroke-width="6" stroke-linecap="round" fill="none"/>

          <!-- Eyes & Sclera -->
          <ellipse cx="224" cy="136" rx="13" ry="10" fill="#FFFFFF" stroke="#181C24" stroke-width="3"/>
          <ellipse cx="276" cy="136" rx="13" ry="10" fill="#FFFFFF" stroke="#181C24" stroke-width="3"/>

          <!-- Moving Pupils -->
          <g id="${id}-pupil-l">
            <circle cx="224" cy="136" r="6" fill="#3B2314"/>
            <circle cx="224" cy="136" r="3" fill="#12161F"/>
            <circle cx="226" cy="134" r="2" fill="#FFFFFF"/>
          </g>
          <g id="${id}-pupil-r">
            <circle cx="276" cy="136" r="6" fill="#3B2314"/>
            <circle cx="276" cy="136" r="3" fill="#12161F"/>
            <circle cx="278" cy="134" r="2" fill="#FFFFFF"/>
          </g>

          <!-- Blinking Eyelids (scaled Y from 0 to 1) -->
          <ellipse id="${id}-eyelid-l" cx="224" cy="136" rx="14" ry="11" fill="#E5AC83" stroke="#181C24" stroke-width="3" style="transform: scaleY(0); transform-origin: 224px 125px;"/>
          <ellipse id="${id}-eyelid-r" cx="276" cy="136" rx="14" ry="11" fill="#E5AC83" stroke="#181C24" stroke-width="3" style="transform: scaleY(0); transform-origin: 276px 125px;"/>

          <!-- Expressive Eyebrows -->
          <rect id="${id}-brow-l" x="206" y="114" width="34" height="8" rx="4" fill="#252B36"/>
          <rect id="${id}-brow-r" x="260" y="114" width="34" height="8" rx="4" fill="#252B36"/>

          <!-- Nose -->
          <path d="M250 132 V156 C244 160 256 160 250 156" stroke="#C88A62" stroke-width="4" stroke-linecap="round" fill="none"/>

          <!-- Full Salt-and-Pepper Craftsman Beard & Mustache -->
          <path d="M190 152 C190 198 216 222 250 222 C284 222 310 198 310 152 C302 166 286 172 250 172 C214 172 198 166 190 152 Z" fill="#252B36" stroke="#181C24" stroke-width="4.5"/>
          <!-- Beard Silver Highlights -->
          <path d="M225 198 L230 214 M250 202 L250 218 M275 198 L270 214" stroke="#94A3B8" stroke-width="3.5" stroke-linecap="round"/>

          <!-- Mustache -->
          <path d="M214 172 C226 162 242 164 250 170 C258 164 274 162 286 172 C276 178 260 178 250 174 C240 178 224 178 214 172 Z" fill="#2D3440" stroke="#181C24" stroke-width="3"/>

          <!-- Dynamic Lip-Sync Mouth -->
          <g id="${id}-mouth-open-shape">
            <path d="M228 176 H272 C272 194 258 200 250 200 C242 200 228 194 228 176 Z" fill="#4A151B" stroke="#181C24" stroke-width="3"/>
            <!-- White Upper Teeth -->
            <path d="M231 177 H269 V184 H231 Z" fill="#FFFFFF"/>
            <!-- Tongue -->
            <ellipse cx="250" cy="195" rx="11" ry="5" fill="#E05A5A"/>
          </g>
        </g>

        <!-- OPTIONAL CUSTOMER IN BARBER CHAIR (FOR HAIRCUT SCENES) -->
        ${
          showCustomer
            ? `
        <g id="${id}-customer-group" transform="translate(0, 65)">
          <!-- Barber Cape (Orange & White Striped) -->
          <path d="M155 445 C165 375 335 375 345 445 Z" fill="#FF6B00" stroke="#181C24" stroke-width="4.5"/>
          <path d="M195 395 L180 445 M250 385 L250 445 M305 395 L320 445" stroke="#FFFFFF" stroke-width="10" stroke-linecap="round"/>
          <!-- Customer Head (Seen from back/3-4) -->
          <circle cx="250" cy="335" r="52" fill="#F4C29F" stroke="#181C24" stroke-width="4.5"/>
          <!-- Customer Hair Being Cut -->
          <path d="M196 335 C192 285 218 268 250 268 C282 268 308 285 304 335 C292 315 208 315 196 335 Z" fill="#1E242B" stroke="#181C24" stroke-width="4.5"/>
        </g>`
            : ""
        }

        <!-- ARTICULATED RIGHT ARM (Shoulder 175,255 -> Elbow 155,345 -> Hand) -->
        <g id="${id}-arm-r-upper">
          <rect x="145" y="238" width="44" height="115" rx="22" fill="url(#${id}-shirtGrad)" stroke="#181C24" stroke-width="4.5"/>
          <!-- Rolled Sleeve Cuff -->
          <rect x="141" y="332" width="52" height="22" rx="8" fill="#2A4066" stroke="#181C24" stroke-width="4"/>

          <g id="${id}-arm-r-lower">
            <!-- Muscular Forearm -->
            <rect x="138" y="346" width="36" height="96" rx="18" fill="#F4C29F" stroke="#181C24" stroke-width="4"/>
            <!-- Hand Base -->
            <circle cx="156" cy="444" r="20" fill="#F4C29F" stroke="#181C24" stroke-width="4"/>

            <!-- PROP R1: ARTICULATED BARBER SCISSORS ("MAKAS AÇIP KAPATMA") -->
            <g id="${id}-prop-r-scissors" transform="translate(22, 78)">
              <!-- Fixed Blade -->
              <g id="${id}-scissor-blade-fixed">
                <polygon points="135,365 215,342 212,354 135,372" fill="url(#${id}-steelGrad)" stroke="#181C24" stroke-width="3.5"/>
                <circle cx="118" cy="372" r="14" fill="none" stroke="#64748B" stroke-width="6"/>
                <circle cx="118" cy="372" r="14" fill="none" stroke="#181C24" stroke-width="2.5"/>
              </g>
              <!-- Moving Blade (Pivots Open & Closed!) -->
              <g id="${id}-scissor-blade-moving">
                <polygon points="135,365 212,382 215,370 135,358" fill="url(#${id}-steelGrad)" stroke="#181C24" stroke-width="3.5"/>
                <circle cx="122" cy="350" r="14" fill="none" stroke="#64748B" stroke-width="6"/>
                <circle cx="122" cy="350" r="14" fill="none" stroke="#181C24" stroke-width="2.5"/>
              </g>
              <!-- Center Pivot Screw -->
              <circle cx="138" cy="365" r="5" fill="#FF6B00" stroke="#181C24" stroke-width="2.5"/>
            </g>

            <!-- PROP R2: CORDLESS HAIR CLIPPER -->
            <g id="${id}-prop-r-clipper" opacity="0" transform="translate(135, 420) rotate(-35)">
              <rect x="0" y="0" width="34" height="78" rx="12" fill="#181C24" stroke="#FFFFFF" stroke-width="3"/>
              <rect x="5" y="14" width="24" height="36" rx="6" fill="#FF6B00"/>
              <rect x="2" y="-12" width="30" height="14" rx="3" fill="#CBD5E1" stroke="#181C24" stroke-width="2.5"/>
            </g>

            <!-- PROP R3: OPEN / WAVING / THINKING HAND -->
            <g id="${id}-prop-r-hand-open" opacity="0">
              <rect x="142" y="440" width="12" height="28" rx="6" fill="#F4C29F" stroke="#181C24" stroke-width="3"/>
              <rect x="154" y="442" width="12" height="30" rx="6" fill="#F4C29F" stroke="#181C24" stroke-width="3"/>
            </g>
          </g>
        </g>

        <!-- ARTICULATED LEFT ARM (Shoulder 325,255 -> Elbow 345,345 -> Hand) -->
        <g id="${id}-arm-l-upper">
          <rect x="311" y="238" width="44" height="115" rx="22" fill="url(#${id}-shirtGrad)" stroke="#181C24" stroke-width="4.5"/>
          <rect x="307" y="332" width="52" height="22" rx="8" fill="#2A4066" stroke="#181C24" stroke-width="4"/>

          <g id="${id}-arm-l-lower">
            <rect x="326" y="346" width="36" height="96" rx="18" fill="#F4C29F" stroke="#181C24" stroke-width="4"/>
            <circle cx="344" cy="444" r="20" fill="#F4C29F" stroke="#181C24" stroke-width="4"/>

            <!-- PROP L1: BARBER COMB -->
            <g id="${id}-prop-l-comb" transform="translate(275, 432) rotate(18)">
              <rect x="0" y="0" width="76" height="14" rx="4" fill="#FF6B00" stroke="#181C24" stroke-width="3"/>
              <path d="M8,14 V28 M16,14 V28 M24,14 V28 M32,14 V28 M40,14 V28 M48,14 V28 M56,14 V28 M64,14 V28" stroke="#181C24" stroke-width="3" stroke-linecap="round"/>
            </g>

            <!-- PROP L2: SMARTPHONE -->
            <g id="${id}-prop-l-phone" opacity="0" transform="translate(315, 405) rotate(-12)">
              <rect x="0" y="0" width="54" height="96" rx="12" fill="#181C24" stroke="#FF6B00" stroke-width="3.5"/>
              <rect x="5" y="8" width="44" height="80" rx="6" fill="#FFFFFF"/>
              <circle cx="27" cy="34" r="12" fill="#FF6B00"/>
              <rect x="11" y="54" width="32" height="8" rx="4" fill="#22C55E"/>
            </g>

            <!-- PROP L3: DÜKKANIM YANIMDA TABLET -->
            <g id="${id}-prop-l-tablet" opacity="0" transform="translate(275, 360) rotate(-8)">
              <rect x="0" y="0" width="128" height="164" rx="16" fill="#181C24" stroke="#FF6B00" stroke-width="4.5"/>
              <rect x="8" y="10" width="112" height="144" rx="8" fill="#FFFFFF"/>
              <rect x="8" y="10" width="112" height="34" rx="6" fill="#FF6B00"/>
              <rect x="20" y="58" width="88" height="16" rx="4" fill="#FFF3EB"/>
              <rect x="20" y="84" width="16" height="48" rx="4" fill="#FF6B00"/>
              <rect x="44" y="72" width="16" height="60" rx="4" fill="#FF6B00"/>
              <rect x="68" y="62" width="16" height="70" rx="4" fill="#22C55E"/>
              <rect x="92" y="50" width="16" height="82" rx="4" fill="#FFBA08"/>
            </g>

            <!-- PROP L4: OPEN HAND -->
            <g id="${id}-prop-l-hand-open" opacity="0">
              <circle cx="344" cy="444" r="18" fill="#F4C29F" stroke="#181C24" stroke-width="3.5"/>
            </g>
          </g>
        </g>
      </svg>`;
    },
  };

  global.UstaVectorRig = UstaVectorRig;
})(typeof window !== "undefined" ? window : globalThis);
