export type ProjectMedia = {
  /** Local path in public/, e.g. /images/drone.webp. */
  src: string;
  alt: string;
};

export type ProjectStep = {
  id: string;
  category: string;
  title: string;
  summary: string;
  status: "documented" | "testing" | "planned";
  media?: ProjectMedia;
  imageCaption: string;
  documentation: string[];
  challenge: string;
  nextToDocument: string;
  resources?: { label: string; href: string }[];
};

// Website identity and initial content. Published content is managed at /admin.
export const project = {
  name: "ESP32_DRONE",
  author: "LuciHan05",
  githubUrl: "https://github.com/LuciHan05",
  // Set these when available. The interface only shows configured links.
  repositoryUrl: "https://github.com/LuciHan05/ESP32_Drone" as string | null,
  email: null as string | null,
  portfolioUrl: null as string | null,
  heroMedia: null as ProjectMedia | null,
  // Optional local MP4. Use with heroMedia as the poster. No autoplay.
  heroVideo: null as string | null,
  description:
    "De la primele conexiuni la primele desprinderi de sol. Jurnalul construirii unei drone cu ESP32, control wireless și software de stabilizare propriu.",
};

export const hardware = [
  { name: "Controler de zbor", value: "ESP32", detail: "Procesarea comenzilor și controlul motoarelor", confirmed: true },
  { name: "Unitate inerțială", value: "MPU6050", detail: "Accelerometru + giroscop, 6 axe", confirmed: true },
  { name: "Propulsie", value: "4 motoare + ESC-uri", detail: "Modelele și puterea urmează să fie documentate", confirmed: true },
  { name: "Cadru", value: "Configurație quad X", detail: "Materialul și dimensiunile: de completat", confirmed: true },
  { name: "Alimentare", value: "De documentat", detail: "Modelul, tensiunea și capacitatea bateriei", confirmed: false },
  { name: "Extensie video", value: "ESP32-CAM", detail: "Streaming pe telefon • etapă planificată", confirmed: false },
];

export const software = [
  { name: "Comunicație", value: "ESP-NOW", detail: "Comenzi wireless de la telecomandă" },
  { name: "Estimarea orientării", value: "Filtru complementar", detail: "Combinarea datelor accelerometrului și giroscopului" },
  { name: "Stabilizare", value: "Control PID", detail: "Pitch și roll pe unghi; yaw pe viteză unghiulară" },
  { name: "Distribuția comenzilor", value: "Mixer quad X", detail: "Throttle + corecții → cele 4 ESC-uri" },
  { name: "Pierderea semnalului", value: "Failsafe · 500 ms", detail: "În versiunea documentată, motoarele trec la minim" },
  { name: "Firmware", value: "C++ / Arduino", detail: "Wire, WiFi, esp_now și ESP32Servo" },
];

// Add a new object here to add a new timeline entry. Numbers are automatic.
// Text describes the shared prototype, not a claim of completed flight validation.
export const steps: ProjectStep[] = [
  {
    id: "cadru",
    category: "01 / MECANICĂ",
    title: "De la idee la un cadru real.",
    summary: "Structura pe care se întâlnesc mecanica, electronica și codul.",
    status: "documented",
    imageCaption: "Cadru și amplasarea componentelor",
    documentation: [
      "Proiectul folosește o configurație quadcopter în X. Cele patru motoare sunt organizate în perechi cu sensuri opuse de rotație, iar controlerul combină comenzile pentru fiecare motor.",
      "Această etapă reunește alegerile mecanice: poziția electronicii, distribuția masei și accesul la cabluri. Materialul, dimensiunile și masa cadrului vor fi adăugate împreună cu fotografiile construcției.",
    ],
    challenge: "Amplasarea componentelor astfel încât masa să fie distribuită echilibrat, iar montajul să rămână accesibil pentru reglaje.",
    nextToDocument: "Fotografii ale cadrului, dimensiuni, material, masă și schița de montaj.",
  },
  {
    id: "electronica",
    category: "02 / HARDWARE",
    title: "Conexiuni care pun ideea în mișcare.",
    summary: "ESP32, senzorul inerțial și cele patru canale de comandă.",
    status: "documented",
    imageCaption: "Electronică și schema conexiunilor",
    documentation: [
      "ESP32 citește datele de la MPU6050 prin I²C și comandă cele patru ESC-uri. Firmware-ul este scris în C++ în ecosistemul Arduino.",
      "Lista exactă a motoarelor, ESC-urilor, bateriei și conexiunilor de alimentare trebuie completată din montajul final. Schema publicată va trebui să corespundă acelei versiuni de hardware.",
    ],
    challenge: "Păstrarea unei scheme clare și a unei corespondențe corecte între cablare, poziția motoarelor și mixerul software.",
    nextToDocument: "Schema electrică, lista completă de componente și fotografii ale cablajului.",
  },
  {
    id: "calibrare",
    category: "03 / CALIBRARE",
    title: "Mai întâi măsurăm. Apoi reglăm.",
    summary: "Calibrarea ESC-urilor, a senzorului și a comenzilor de pe telecomandă.",
    status: "documented",
    imageCaption: "Montajul de test și calibrare",
    documentation: [
      "În discuțiile de dezvoltare au fost ajustate pragurile de comandă ale ESC-urilor și centrele axelor joystick-urilor. Aceste valori sunt specifice componentelor și versiunii de firmware testate.",
      "Documentația acestei etape va include măsurătorile, condițiile testului și configurația folosită, pentru ca rezultatele să poată fi urmărite între versiuni.",
    ],
    challenge: "Obținerea unui răspuns consecvent al celor patru motoare și separarea erorilor de calibrare de cele mecanice.",
    nextToDocument: "Valorile măsurate, loguri și procedura de calibrare efectuată fără elice.",
  },
  {
    id: "software",
    category: "04 / FIRMWARE",
    title: "Un echilibru scris în cod.",
    summary: "Filtru complementar, control PID și mixer pentru configurația X.",
    status: "documented",
    imageCaption: "Schema logică a controlului",
    documentation: [
      "Un filtru complementar estimează pitch și roll din datele MPU6050. Controlul PID calculează corecțiile, iar mixerul le combină cu throttle-ul pentru cele patru motoare. Yaw este controlat pe baza vitezei unghiulare.",
      "Telecomanda trimite comenzile prin ESP-NOW. Versiunea discutată include armare/dezarmare și trecerea motoarelor la minim când nu mai sunt primite comenzi timp de 500 ms.",
    ],
    challenge: "Reglarea răspunsului fără oscilații și verificarea sensului corecțiilor pe fiecare axă.",
    nextToDocument: "Versiunea firmware, diagrama bloc, parametrii PID și loguri pentru fiecare modificare.",
  },
  {
    id: "teste",
    category: "05 / TESTE REALE",
    title: "Primele desprinderi de sol.",
    summary: "Ce funcționează în practică și ce mai are nevoie de reglaje.",
    status: "testing",
    imageCaption: "Fotografie sau cadru din testele de zbor",
    documentation: [
      "Au fost raportate ridicări scurte de la sol, inclusiv la aproximativ jumătate de metru. În timpul testelor a rămas o tendință de rotație pe yaw, inclusiv după înlocuirea elicelor.",
      "Etapa rămâne în testare. Nu sunt încă publicate rezultate măsurate pentru autonomie, rază de control sau stabilitatea unui zbor complet.",
    ],
    challenge: "Identificarea cauzei derivei pe yaw prin corelarea comportamentului mecanic cu datele senzorului și comenzile motoarelor.",
    nextToDocument: "Filmări, durata testelor, loguri și comparații înainte/după reglaje.",
  },
  {
    id: "camera",
    category: "06 / CE URMEAZĂ",
    title: "O nouă perspectivă, de la bord.",
    summary: "O extensie cu ESP32-CAM pentru imagine live pe telefon.",
    status: "planned",
    imageCaption: "Viitorul modul de cameră",
    documentation: [
      "ESP32-CAM a fost ales ca direcție de explorat pentru un flux video accesibil în browserul telefonului. Integrarea este planificată; nu este prezentată ca funcție deja implementată.",
      "Documentarea va urmări montajul, alimentarea și comportamentul comunicației de control atunci când transmisia video este activă.",
    ],
    challenge: "Evaluarea interferențelor dintre transmisia video Wi-Fi și comunicația ESP-NOW în configurația reală.",
    nextToDocument: "Modulul ales, schema de alimentare și măsurători ale legăturii radio cu și fără video.",
  },
];
