// src/constants/exerciseAnimations.js
// Animaciones SVG anatómicas por grupo muscular.
// Figura humana con músculos específicos resaltados y animación del movimiento.

export const MUSCLE_ANIMATIONS = {

Pecho: `<svg viewBox="0 0 300 420" xmlns="http://www.w3.org/2000/svg">
<style>
@keyframes benchPress {
  0%,100% { transform: translateY(0); }
  50% { transform: translateY(-28px); }
}
@keyframes pecFlash {
  0%,100% { opacity:.45; }
  50% { opacity:1; }
}
@keyframes armRotL {
  0%,100% { transform: rotate(0deg); }
  50% { transform: rotate(-38deg); }
}
@keyframes armRotR {
  0%,100% { transform: rotate(0deg); }
  50% { transform: rotate(38deg); }
}
.body    { animation: benchPress 2s ease-in-out infinite; }
.pec     { animation: pecFlash   2s ease-in-out infinite; }
.arm-l   { animation: armRotL    2s ease-in-out infinite; transform-origin:110px 188px; }
.arm-r   { animation: armRotR    2s ease-in-out infinite; transform-origin:190px 188px; }
</style>
<rect width="300" height="420" fill="#0A0A0A"/>
<!-- banco -->
<rect x="55" y="305" width="190" height="12" rx="6" fill="#2a2a2a"/>
<rect x="70" y="317" width="16" height="36" rx="4" fill="#222"/>
<rect x="214" y="317" width="16" height="36" rx="4" fill="#222"/>
<!-- barra -->
<rect x="38" y="128" width="224" height="9" rx="4" fill="#555"/>
<ellipse cx="46"  cy="132" rx="9" ry="14" fill="#444"/>
<ellipse cx="254" cy="132" rx="9" ry="14" fill="#444"/>

<g class="body">
  <!-- silueta torso -->
  <ellipse cx="150" cy="175" rx="42" ry="18" fill="#E8B500"/>
  <rect x="108" y="172" width="84" height="90" rx="8" fill="#E8B500"/>
  <!-- pectorales resaltados -->
  <ellipse class="pec" cx="135" cy="196" rx="22" ry="15" fill="#FF5722" opacity=".9"/>
  <ellipse class="pec" cx="165" cy="196" rx="22" ry="15" fill="#FF5722" opacity=".9"/>
  <!-- líneas musculares pecho -->
  <line x1="113" y1="188" x2="148" y2="210" stroke="#FF7043" stroke-width="1.5" opacity=".5" class="pec"/>
  <line x1="187" y1="188" x2="152" y2="210" stroke="#FF7043" stroke-width="1.5" opacity=".5" class="pec"/>
  <!-- cabeza -->
  <ellipse cx="150" cy="152" rx="20" ry="22" fill="#E8B500"/>
  <ellipse cx="144" cy="148" rx="3" ry="3.5" fill="#0A0A0A"/>
  <ellipse cx="156" cy="148" rx="3" ry="3.5" fill="#0A0A0A"/>
  <!-- abdomen líneas -->
  <line x1="143" y1="222" x2="143" y2="258" stroke="#C49A00" stroke-width="2"/>
  <line x1="157" y1="222" x2="157" y2="258" stroke="#C49A00" stroke-width="2"/>
  <line x1="118" y1="230" x2="182" y2="230" stroke="#C49A00" stroke-width="1.5"/>
  <line x1="118" y1="242" x2="182" y2="242" stroke="#C49A00" stroke-width="1.5"/>
  <!-- piernas -->
  <rect x="115" y="260" width="26" height="52" rx="8" fill="#E8B500"/>
  <rect x="159" y="260" width="26" height="52" rx="8" fill="#E8B500"/>
  <!-- brazo izq -->
  <g class="arm-l">
    <rect x="80"  y="182" width="32" height="13" rx="6" fill="#E8B500"/>
    <rect x="60"  y="162" width="13" height="34" rx="6" fill="#E8B500"/>
  </g>
  <!-- brazo der -->
  <g class="arm-r">
    <rect x="188" y="182" width="32" height="13" rx="6" fill="#E8B500"/>
    <rect x="227" y="162" width="13" height="34" rx="6" fill="#E8B500"/>
  </g>
</g>
<!-- label -->
<text x="150" y="400" text-anchor="middle" fill="#E8B500" font-size="13" font-weight="bold" font-family="sans-serif" letter-spacing="2">PECHO</text>
</svg>`,

Espalda: `<svg viewBox="0 0 300 420" xmlns="http://www.w3.org/2000/svg">
<style>
@keyframes pullDown {
  0%,100% { transform: translateY(0); }
  50% { transform: translateY(26px); }
}
@keyframes latFlash {
  0%,100% { opacity:.4; }
  50% { opacity:1; }
}
@keyframes elbowPull {
  0%,100% { transform: rotate(0deg); }
  50% { transform: rotate(52deg); }
}
.puller   { animation: pullDown  2s ease-in-out infinite; }
.lat      { animation: latFlash  2s ease-in-out infinite; }
.elbow-l  { animation: elbowPull 2s ease-in-out infinite; transform-origin:100px 182px; }
.elbow-r  { animation: elbowPull 2s ease-in-out infinite reverse; transform-origin:200px 182px; }
</style>
<rect width="300" height="420" fill="#0A0A0A"/>
<!-- barra dominadas -->
<rect x="55" y="72" width="190" height="9" rx="4" fill="#555"/>
<rect x="50"  y="60" width="12" height="26" rx="4" fill="#444"/>
<rect x="238" y="60" width="12" height="26" rx="4" fill="#444"/>

<g class="puller">
  <!-- cabeza -->
  <ellipse cx="150" cy="108" rx="20" ry="22" fill="#E8B500"/>
  <ellipse cx="144" cy="104" rx="3" ry="3.5" fill="#0A0A0A"/>
  <ellipse cx="156" cy="104" rx="3" ry="3.5" fill="#0A0A0A"/>
  <!-- torso - vista posterior -->
  <ellipse cx="150" cy="140" rx="44" ry="14" fill="#E8B500"/>
  <rect x="106" y="138" width="88" height="95" rx="10" fill="#E8B500"/>
  <!-- trapecio -->
  <path d="M130 138 Q150 126 170 138" fill="#FF5722" opacity=".7" class="lat"/>
  <!-- dorsales izq -->
  <ellipse class="lat" cx="118" cy="175" rx="16" ry="32" fill="#FF5722" opacity=".85" transform="rotate(-8 118 175)"/>
  <!-- dorsales der -->
  <ellipse class="lat" cx="182" cy="175" rx="16" ry="32" fill="#FF5722" opacity=".85" transform="rotate(8 182 175)"/>
  <!-- columna -->
  <line x1="150" y1="142" x2="150" y2="228" stroke="#C49A00" stroke-width="2.5"/>
  <!-- romboides -->
  <ellipse class="lat" cx="150" cy="158" rx="18" ry="12" fill="#FF7043" opacity=".6"/>
  <!-- piernas -->
  <rect x="118" y="232" width="24" height="68" rx="8" fill="#E8B500"/>
  <rect x="158" y="232" width="24" height="68" rx="8" fill="#E8B500"/>
  <!-- brazo superior izq fijo -->
  <rect x="88" y="90" width="13" height="44" rx="6" fill="#E8B500"/>
  <!-- antebrazo izq con codo -->
  <g class="elbow-l">
    <rect x="88" y="178" width="13" height="44" rx="6" fill="#E8B500"/>
  </g>
  <!-- mano izq -->
  <ellipse cx="94" cy="82" rx="9" ry="7" fill="#E8B500"/>
  <!-- brazo superior der fijo -->
  <rect x="199" y="90" width="13" height="44" rx="6" fill="#E8B500"/>
  <g class="elbow-r">
    <rect x="199" y="178" width="13" height="44" rx="6" fill="#E8B500"/>
  </g>
  <ellipse cx="206" cy="82" rx="9" ry="7" fill="#E8B500"/>
</g>
<text x="150" y="400" text-anchor="middle" fill="#E8B500" font-size="13" font-weight="bold" font-family="sans-serif" letter-spacing="2">ESPALDA</text>
</svg>`,

Piernas: `<svg viewBox="0 0 300 420" xmlns="http://www.w3.org/2000/svg">
<style>
@keyframes squat {
  0%,100% { transform: translateY(0); }
  50%      { transform: translateY(32px); }
}
@keyfunction quadFlash {
  0%,100% { opacity:.4; }
  50% { opacity:1; }
}
@keyframes quadFlash {
  0%,100% { opacity:.4; }
  50% { opacity:1; }
}
@keyframes kneeL {
  0%,100% { transform: rotate(0deg); }
  50%      { transform: rotate(36deg); }
}
@keyframes kneeR {
  0%,100% { transform: rotate(0deg); }
  50%      { transform: rotate(-36deg); }
}
.squat-body { animation: squat 2s ease-in-out infinite; }
.quad       { animation: quadFlash 2s ease-in-out infinite; }
.shin-l     { animation: kneeL 2s ease-in-out infinite; transform-origin:128px 272px; }
.shin-r     { animation: kneeR 2s ease-in-out infinite; transform-origin:172px 272px; }
</style>
<rect width="300" height="420" fill="#0A0A0A"/>
<!-- barra -->
<rect x="48" y="118" width="204" height="9" rx="4" fill="#555"/>
<ellipse cx="56"  cy="122" rx="10" ry="16" fill="#444"/>
<ellipse cx="244" cy="122" rx="10" ry="16" fill="#444"/>

<g class="squat-body">
  <ellipse cx="150" cy="86" rx="20" ry="22" fill="#E8B500"/>
  <ellipse cx="144" cy="82" rx="3" ry="3.5" fill="#0A0A0A"/>
  <ellipse cx="156" cy="82" rx="3" ry="3.5" fill="#0A0A0A"/>
  <!-- torso -->
  <rect x="112" y="107" width="76" height="80" rx="8" fill="#E8B500"/>
  <!-- brazos sobre barra -->
  <rect x="78"  y="114" width="36" height="12" rx="6" fill="#E8B500"/>
  <rect x="186" y="114" width="36" height="12" rx="6" fill="#E8B500"/>
  <!-- muslo izq - cuádriceps -->
  <rect x="114" y="186" width="30" height="72" rx="10" fill="#E8B500"/>
  <ellipse class="quad" cx="129" cy="218" rx="14" ry="30" fill="#FF5722" opacity=".9"/>
  <!-- muslo der - cuádriceps -->
  <rect x="156" y="186" width="30" height="72" rx="10" fill="#E8B500"/>
  <ellipse class="quad" cx="171" cy="218" rx="14" ry="30" fill="#FF5722" opacity=".9"/>
  <!-- glúteos -->
  <ellipse class="quad" cx="150" cy="192" rx="30" ry="12" fill="#FF7043" opacity=".7"/>
  <!-- pantorrillas -->
  <g class="shin-l">
    <rect x="114" y="257" width="28" height="55" rx="8" fill="#E8B500"/>
    <ellipse cx="128" cy="280" rx="10" ry="20" fill="#FF7043" opacity=".5" class="quad"/>
  </g>
  <g class="shin-r">
    <rect x="158" y="257" width="28" height="55" rx="8" fill="#E8B500"/>
    <ellipse cx="172" cy="280" rx="10" ry="20" fill="#FF7043" opacity=".5" class="quad"/>
  </g>
  <ellipse cx="128" cy="312" rx="18" ry="9" fill="#C49A00"/>
  <ellipse cx="172" cy="312" rx="18" ry="9" fill="#C49A00"/>
</g>
<text x="150" y="400" text-anchor="middle" fill="#E8B500" font-size="13" font-weight="bold" font-family="sans-serif" letter-spacing="2">PIERNAS</text>
</svg>`,

Hombros: `<svg viewBox="0 0 300 420" xmlns="http://www.w3.org/2000/svg">
<style>
@keyframes ohPress {
  0%,100% { transform: translateY(0); }
  50%      { transform: translateY(-30px); }
}
@keyframes deltFlash {
  0%,100% { opacity:.4; }
  50%      { opacity:1; }
}
@keyframes foreArmL {
  0%,100% { transform: rotate(0deg); }
  50%      { transform: rotate(-50deg); }
}
@keyframes foreArmR {
  0%,100% { transform: rotate(0deg); }
  50%      { transform: rotate(50deg); }
}
.press-body { animation: ohPress    2s ease-in-out infinite; }
.delt       { animation: deltFlash  2s ease-in-out infinite; }
.fore-l     { animation: foreArmL   2s ease-in-out infinite; transform-origin:90px 172px; }
.fore-r     { animation: foreArmR   2s ease-in-out infinite; transform-origin:210px 172px; }
</style>
<rect width="300" height="420" fill="#0A0A0A"/>
<g class="press-body">
  <ellipse cx="150" cy="82" rx="20" ry="22" fill="#E8B500"/>
  <ellipse cx="144" cy="78" rx="3" ry="3.5" fill="#0A0A0A"/>
  <ellipse cx="156" cy="78" rx="3" ry="3.5" fill="#0A0A0A"/>
  <!-- torso -->
  <rect x="114" y="103" width="72" height="88" rx="8" fill="#E8B500"/>
  <!-- deltoides anterior -->
  <ellipse class="delt" cx="104" cy="122" rx="20" ry="14" fill="#FF5722" opacity=".9" transform="rotate(-20 104 122)"/>
  <ellipse class="delt" cx="196" cy="122" rx="20" ry="14" fill="#FF5722" opacity=".9" transform="rotate(20 196 122)"/>
  <!-- deltoides lateral -->
  <ellipse class="delt" cx="100" cy="136" rx="14" ry="10" fill="#FF7043" opacity=".7" transform="rotate(-30 100 136)"/>
  <ellipse class="delt" cx="200" cy="136" rx="14" ry="10" fill="#FF7043" opacity=".7" transform="rotate(30 200 136)"/>
  <!-- trapecio -->
  <path d="M120 104 Q150 92 180 104" fill="#FF5722" opacity=".5" class="delt"/>
  <!-- abs lineas -->
  <line x1="143" y1="118" x2="143" y2="186" stroke="#C49A00" stroke-width="1.5"/>
  <line x1="157" y1="118" x2="157" y2="186" stroke="#C49A00" stroke-width="1.5"/>
  <!-- piernas estáticas -->
  <rect x="116" y="190" width="26" height="75" rx="9" fill="#E8B500"/>
  <rect x="158" y="190" width="26" height="75" rx="9" fill="#E8B500"/>
  <ellipse cx="129" cy="266" rx="15" ry="8" fill="#C49A00"/>
  <ellipse cx="171" cy="266" rx="15" ry="8" fill="#C49A00"/>
  <!-- brazo superior izq -->
  <rect x="84" y="112" width="13" height="58" rx="6" fill="#E8B500"/>
  <!-- antebrazo izq -->
  <g class="fore-l">
    <rect x="84" y="166" width="13" height="48" rx="6" fill="#E8B500"/>
  </g>
  <!-- brazo superior der -->
  <rect x="203" y="112" width="13" height="58" rx="6" fill="#E8B500"/>
  <g class="fore-r">
    <rect x="203" y="166" width="13" height="48" rx="6" fill="#E8B500"/>
  </g>
  <!-- barra -->
  <rect x="72" y="160" width="156" height="8" rx="4" fill="#555"/>
</g>
<text x="150" y="400" text-anchor="middle" fill="#E8B500" font-size="13" font-weight="bold" font-family="sans-serif" letter-spacing="2">HOMBROS</text>
</svg>`,

Brazos: `<svg viewBox="0 0 300 420" xmlns="http://www.w3.org/2000/svg">
<style>
@keyframes curlL {
  0%,100% { transform: rotate(0deg); }
  50%      { transform: rotate(-82deg); }
}
@keyframes curlR {
  0%,100% { transform: rotate(0deg); }
  50%      { transform: rotate(82deg); }
}
@keyframes bicepBulge {
  0%,100% { ry:10; opacity:.5; }
  50%      { ry:15; opacity:1; }
}
.curl-l   { animation: curlL 2s ease-in-out infinite; transform-origin:108px 226px; }
.curl-r   { animation: curlR 2s ease-in-out infinite; transform-origin:192px 226px; }
.bic-l    { animation: bicepBulge 2s ease-in-out infinite; }
.bic-r    { animation: bicepBulge 2s ease-in-out infinite; }
</style>
<rect width="300" height="420" fill="#0A0A0A"/>
<ellipse cx="150" cy="82" rx="20" ry="22" fill="#E8B500"/>
<ellipse cx="144" cy="78" rx="3" ry="3.5" fill="#0A0A0A"/>
<ellipse cx="156" cy="78" rx="3" ry="3.5" fill="#0A0A0A"/>
<!-- torso -->
<rect x="116" y="103" width="68" height="92" rx="8" fill="#E8B500"/>
<!-- lineas abs -->
<line x1="143" y1="118" x2="143" y2="190" stroke="#C49A00" stroke-width="1.5"/>
<line x1="157" y1="118" x2="157" y2="190" stroke="#C49A00" stroke-width="1.5"/>
<line x1="120" y1="136" x2="180" y2="136" stroke="#C49A00" stroke-width="1"/>
<line x1="120" y1="154" x2="180" y2="154" stroke="#C49A00" stroke-width="1"/>
<!-- piernas -->
<rect x="118" y="194" width="24" height="78" rx="9" fill="#E8B500"/>
<rect x="158" y="194" width="24" height="78" rx="9" fill="#E8B500"/>
<ellipse cx="130" cy="272" rx="14" ry="8" fill="#C49A00"/>
<ellipse cx="170" cy="272" rx="14" ry="8" fill="#C49A00"/>
<!-- brazo izq sup fijo -->
<rect x="96" y="110" width="13" height="60" rx="6" fill="#E8B500"/>
<!-- bíceps izq resaltado -->
<ellipse class="bic-l" cx="102" cy="148" rx="9" ry="10" fill="#FF5722"/>
<!-- antebrazo izq curling -->
<g class="curl-l">
  <rect x="96" y="224" width="13" height="52" rx="6" fill="#E8B500"/>
  <!-- mancuerna -->
  <rect x="84" y="272" width="36" height="9" rx="4" fill="#555"/>
  <rect x="80" y="266" width="10" height="21" rx="3" fill="#444"/>
  <rect x="120" y="266" width="10" height="21" rx="3" fill="#444"/>
</g>
<!-- brazo der sup fijo -->
<rect x="191" y="110" width="13" height="60" rx="6" fill="#E8B500"/>
<ellipse class="bic-r" cx="198" cy="148" rx="9" ry="10" fill="#FF5722"/>
<g class="curl-r">
  <rect x="191" y="224" width="13" height="52" rx="6" fill="#E8B500"/>
  <rect x="180" y="272" width="36" height="9" rx="4" fill="#555"/>
  <rect x="176" y="266" width="10" height="21" rx="3" fill="#444"/>
  <rect x="216" y="266" width="10" height="21" rx="3" fill="#444"/>
</g>
<!-- tríceps izq -->
<ellipse cx="102" cy="160" rx="7" ry="9" fill="#FF7043" opacity=".5"/>
<ellipse cx="198" cy="160" rx="7" ry="9" fill="#FF7043" opacity=".5"/>
<text x="150" y="400" text-anchor="middle" fill="#E8B500" font-size="13" font-weight="bold" font-family="sans-serif" letter-spacing="2">BRAZOS</text>
</svg>`,

Core: `<svg viewBox="0 0 300 420" xmlns="http://www.w3.org/2000/svg">
<style>
@keyframes crunch {
  0%,100% { transform: rotate(0deg) translateY(0); }
  50%      { transform: rotate(-28deg) translateY(-14px); }
}
@keyframes absFlash {
  0%,100% { opacity:.4; }
  50%      { opacity:1; }
}
@keyframes legsRaise {
  0%,100% { transform: rotate(0deg); }
  50%      { transform: rotate(-22deg); }
}
.crunch-upper { animation: crunch    2s ease-in-out infinite; transform-origin:150px 248px; }
.abs          { animation: absFlash  2s ease-in-out infinite; }
.legs-raise   { animation: legsRaise 2s ease-in-out infinite; transform-origin:150px 252px; }
</style>
<rect width="300" height="420" fill="#0A0A0A"/>
<!-- colchoneta -->
<rect x="38" y="305" width="224" height="10" rx="5" fill="#1a2a1a"/>

<g class="crunch-upper">
  <ellipse cx="150" cy="158" rx="20" ry="22" fill="#E8B500"/>
  <ellipse cx="144" cy="154" rx="3" ry="3.5" fill="#0A0A0A"/>
  <ellipse cx="156" cy="154" rx="3" ry="3.5" fill="#0A0A0A"/>
  <!-- torso -->
  <rect x="114" y="178" width="72" height="86" rx="8" fill="#E8B500"/>
  <!-- recto abdominal — 3 pares de cuadrados -->
  <rect class="abs" x="132" y="184" width="14" height="12" rx="3" fill="#FF5722" opacity=".9"/>
  <rect class="abs" x="154" y="184" width="14" height="12" rx="3" fill="#FF5722" opacity=".9"/>
  <rect class="abs" x="132" y="202" width="14" height="12" rx="3" fill="#FF5722" opacity=".9"/>
  <rect class="abs" x="154" y="202" width="14" height="12" rx="3" fill="#FF5722" opacity=".9"/>
  <rect class="abs" x="132" y="220" width="14" height="12" rx="3" fill="#FF5722" opacity=".85"/>
  <rect class="abs" x="154" y="220" width="14" height="12" rx="3" fill="#FF5722" opacity=".85"/>
  <!-- oblicuos -->
  <ellipse class="abs" cx="116" cy="210" rx="9" ry="22" fill="#FF7043" opacity=".6" transform="rotate(-10 116 210)"/>
  <ellipse class="abs" cx="184" cy="210" rx="9" ry="22" fill="#FF7043" opacity=".6" transform="rotate(10 184 210)"/>
  <!-- linea alba -->
  <line x1="150" y1="180" x2="150" y2="260" stroke="#C49A00" stroke-width="2"/>
  <!-- brazos detrás cabeza -->
  <rect x="90"  y="152" width="36" height="11" rx="5" fill="#E8B500"/>
  <rect x="174" y="152" width="36" height="11" rx="5" fill="#E8B500"/>
</g>
<g class="legs-raise">
  <rect x="118" y="250" width="24" height="62" rx="9" fill="#E8B500"/>
  <rect x="158" y="250" width="24" height="62" rx="9" fill="#E8B500"/>
  <ellipse cx="130" cy="312" rx="15" ry="8" fill="#C49A00"/>
  <ellipse cx="170" cy="312" rx="15" ry="8" fill="#C49A00"/>
</g>
<text x="150" y="400" text-anchor="middle" fill="#E8B500" font-size="13" font-weight="bold" font-family="sans-serif" letter-spacing="2">CORE</text>
</svg>`,

Cardio: `<svg viewBox="0 0 300 420" xmlns="http://www.w3.org/2000/svg">
<style>
@keyframes runBody {
  0%,100% { transform: translateX(0) rotate(4deg); }
  50%      { transform: translateX(0) rotate(-4deg); }
}
@keyframes legFwd {
  0%,100% { transform: rotate(-40deg); }
  50%      { transform: rotate(40deg); }
}
@keyframes legBck {
  0%,100% { transform: rotate(40deg); }
  50%      { transform: rotate(-40deg); }
}
@keyframes armFwd {
  0%,100% { transform: rotate(-35deg); }
  50%      { transform: rotate(35deg); }
}
@keyframes armBck {
  0%,100% { transform: rotate(35deg); }
  50%      { transform: rotate(-35deg); }
}
@keyframes heartBeat {
  0%,70%,100% { transform: scale(1); }
  35%          { transform: scale(1.4); }
}
.runner  { animation: runBody .7s ease-in-out infinite; }
.leg-a   { animation: legFwd  .7s ease-in-out infinite; transform-origin:150px 230px; }
.leg-b   { animation: legBck  .7s ease-in-out infinite; transform-origin:150px 230px; }
.arm-a   { animation: armFwd  .7s ease-in-out infinite; transform-origin:138px 186px; }
.arm-b   { animation: armBck  .7s ease-in-out infinite; transform-origin:162px 186px; }
.heart   { animation: heartBeat .7s ease-in-out infinite; transform-origin:150px 118px; }
</style>
<rect width="300" height="420" fill="#0A0A0A"/>
<!-- suelo con líneas de pista -->
<rect x="30" y="318" width="240" height="6" rx="3" fill="#1a3a1a"/>
<line x1="50" y1="321" x2="90" y2="321" stroke="#2a5a2a" stroke-width="2"/>
<line x1="130" y1="321" x2="170" y2="321" stroke="#2a5a2a" stroke-width="2"/>
<line x1="210" y1="321" x2="250" y2="321" stroke="#2a5a2a" stroke-width="2"/>
<!-- corazón -->
<g class="heart">
  <path d="M150 132 C150 132 128 116 118 104 C108 92 108 76 120 70 C132 64 144 74 150 86 C156 74 168 64 180 70 C192 76 192 92 182 104 C172 116 150 132 150 132Z" fill="#FF5722" opacity=".9"/>
</g>
<g class="runner">
  <!-- cabeza -->
  <ellipse cx="150" cy="106" rx="20" ry="22" fill="#E8B500"/>
  <ellipse cx="143" cy="102" rx="3" ry="3.5" fill="#0A0A0A"/>
  <ellipse cx="157" cy="102" rx="3" ry="3.5" fill="#0A0A0A"/>
  <!-- torso inclinado -->
  <rect x="130" y="126" width="40" height="78" rx="8" fill="#E8B500" transform="rotate(8 150 165)"/>
  <!-- músculos cardio — todo el cuerpo activo -->
  <ellipse cx="150" cy="162" rx="18" ry="34" fill="#FF5722" opacity=".35" transform="rotate(8 150 162)"/>
  <!-- pierna A adelante -->
  <g class="leg-a">
    <rect x="138" y="228" width="18" height="52" rx="7" fill="#E8B500"/>
    <rect x="136" y="276" width="22" height="12" rx="4" fill="#555" transform="rotate(20 147 282)"/>
  </g>
  <!-- pierna B atrás -->
  <g class="leg-b">
    <rect x="144" y="228" width="18" height="52" rx="7" fill="#C49A00"/>
    <rect x="144" y="276" width="22" height="12" rx="4" fill="#C49A00" transform="rotate(-20 155 282)"/>
  </g>
  <!-- brazo A -->
  <g class="arm-a">
    <rect x="106" y="158" width="34" height="11" rx="5" fill="#E8B500"/>
  </g>
  <!-- brazo B -->
  <g class="arm-b">
    <rect x="160" y="158" width="34" height="11" rx="5" fill="#E8B500"/>
  </g>
</g>
<text x="150" y="400" text-anchor="middle" fill="#E8B500" font-size="13" font-weight="bold" font-family="sans-serif" letter-spacing="2">CARDIO</text>
</svg>`,

Otro: `<svg viewBox="0 0 300 420" xmlns="http://www.w3.org/2000/svg">
<style>
@keyframes fullPulse {
  0%,100% { transform: translateY(0) scale(1); }
  50%      { transform: translateY(-10px) scale(1.03); }
}
@keyframes glowRing {
  0%,100% { opacity:.2; r:70; }
  50%      { opacity:.6; r:82; }
}
@keyframes allMuscles {
  0%,100% { opacity:.3; }
  50%      { opacity:.85; }
}
.full-body { animation: fullPulse  2s ease-in-out infinite; transform-origin:150px 210px; }
.glow      { animation: glowRing   2s ease-in-out infinite; }
.muscles   { animation: allMuscles 2s ease-in-out infinite; }
</style>
<rect width="300" height="420" fill="#0A0A0A"/>
<circle class="glow" cx="150" cy="210" r="80" fill="none" stroke="#E8B500" stroke-width="1.5"/>
<g class="full-body">
  <ellipse cx="150" cy="82" rx="20" ry="22" fill="#E8B500"/>
  <ellipse cx="144" cy="78" rx="3" ry="3.5" fill="#0A0A0A"/>
  <ellipse cx="156" cy="78" rx="3" ry="3.5" fill="#0A0A0A"/>
  <!-- torso -->
  <rect x="114" y="103" width="72" height="90" rx="8" fill="#E8B500"/>
  <!-- todos los músculos activos -->
  <ellipse class="muscles" cx="135" cy="122" rx="18" ry="14" fill="#FF5722"/>
  <ellipse class="muscles" cx="165" cy="122" rx="18" ry="14" fill="#FF5722"/>
  <ellipse class="muscles" cx="150" cy="108" rx="24" ry="8" fill="#FF7043"/>
  <rect class="muscles" x="133" y="140" width="12" height="10" rx="3" fill="#FF5722"/>
  <rect class="muscles" x="155" y="140" width="12" height="10" rx="3" fill="#FF5722"/>
  <rect class="muscles" x="133" y="156" width="12" height="10" rx="3" fill="#FF5722"/>
  <rect class="muscles" x="155" y="156" width="12" height="10" rx="3" fill="#FF5722"/>
  <!-- brazos -->
  <rect x="86"  y="110" width="14" height="70" rx="6" fill="#E8B500"/>
  <rect x="200" y="110" width="14" height="70" rx="6" fill="#E8B500"/>
  <ellipse class="muscles" cx="93"  cy="148" rx="8" ry="12" fill="#FF5722"/>
  <ellipse class="muscles" cx="207" cy="148" rx="8" ry="12" fill="#FF5722"/>
  <!-- piernas -->
  <rect x="116" y="192" width="28" height="80" rx="9" fill="#E8B500"/>
  <rect x="156" y="192" width="28" height="80" rx="9" fill="#E8B500"/>
  <ellipse class="muscles" cx="130" cy="230" rx="12" ry="32" fill="#FF5722"/>
  <ellipse class="muscles" cx="170" cy="230" rx="12" ry="32" fill="#FF5722"/>
  <ellipse cx="130" cy="272" rx="14" ry="8" fill="#C49A00"/>
  <ellipse cx="170" cy="272" rx="14" ry="8" fill="#C49A00"/>
</g>
<text x="150" y="400" text-anchor="middle" fill="#E8B500" font-size="13" font-weight="bold" font-family="sans-serif" letter-spacing="2">EJERCICIO</text>
</svg>`,

};

export function getAnimationForMuscleGroup(muscleGroup) {
  return MUSCLE_ANIMATIONS[muscleGroup] || MUSCLE_ANIMATIONS['Otro'];
}

export function getExerciseAnimation(exercise) {
  if (exercise?.animationSvg) return exercise.animationSvg;
  return getAnimationForMuscleGroup(exercise?.muscleGroup);
}