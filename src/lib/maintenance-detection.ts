// Deliberately conservative, local and deterministic. Never writes a decision.
const rules: [string, RegExp][] = [
  ["PLAQUETTES", /\b(plaquette\w*|brake pads?)\b/], ["DISQUES", /\b(disques? (de )?frein\w*|brake discs?)\b/],
  ["LIQUIDE_FREIN", /\b(liquide (de )?frein\w*|purge (des? )?freins?|brake fluid)\b/], ["ETRIERS", /\b(etrier\w*|calipers?)\b/],
  ["HUILE_BOITE", /\b(huile (de )?boite|vidange (de (la )?)?boite)\b/], ["EMBRAYAGE", /\b(embrayage|clutch)\b/],
  ["BOITE_VITESSES", /\b(boite (de )?vitesses?|gearbox)\b/], ["VIDANGE", /\bvidange\b(?! (de (la )?)?boite)/],
  ["BOUGIES", /\b(bougies?|spark plugs?)\b/], ["DISTRIBUTION", /\b(distribution|timing belt)\b/],
  ["REFROIDISSEMENT", /\b(refroidissement|radiateur|pompe a eau|coolant)\b/],
  ["CATALYSEUR", /\b(catalyseur|catalytic)\b/], ["SILENCIEUX", /\b(silencieux|muffler)\b/], ["LIGNE_ECHAPPEMENT", /\bligne (d )?echappement\b/],
  ["PEINTURE", /\b(peinture|repeindre)\b/], ["PARE_CHOCS", /\bpare chocs?\b/],
  ["REPARATION_CARROSSERIE", /\b(debosselage|reparation (de (la )?)?carrosserie)\b/],
  ["REMPLACEMENT_PNEUS", /\b(remplacement|changer|changement|montage) (des? |de |du )?(pneus?|pneumatiques?)\b/],
  ["EQUILIBRAGE", /\bequilibrage\b/], ["GEOMETRIE", /\b(geometrie|parallelisme)\b/],
  ["FILTRE_HUILE", /\bfiltre (a |d )?huile\b/], ["FILTRE_AIR", /\bfiltre (a |d )?air\b/],
  ["FILTRE_HABITACLE", /\bfiltre (d |a )?(habitacle|pollen)\b/], ["FILTRE_CARBURANT", /\bfiltre (a |de )?(carburant|gazole|gasoil|essence)\b/],
  ["BATTERIE", /\b(batterie|battery)\b/], ["ESSUIE_GLACES", /\b(essuie glaces?|balais? (d )?essuie)\b/],
  ["ECLAIRAGE", /\b(ampoules?|phares?|eclairage)\b/], ["SUSPENSION", /\b(amortisseurs?|suspension)\b/],
  ["DIRECTION", /\b(cremaillere|rotules? (de )?direction)\b/], ["CONTROLE_TECHNIQUE", /\b(controle technique|contre visite)\b/],
  ["ENTRETIEN_CONSTRUCTEUR", /\b(revision constructeur|entretien constructeur)\b/],
];
export function detectMaintenance(title: string): { type: string | null; ambiguous: boolean } {
  const text = title.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const matches = rules.filter(([, pattern]) => pattern.test(text));
  // Oil changes for a gearbox must not become an engine oil change.
  const types = matches.map(([type]) => type).filter(type => !(type === "BOITE_VITESSES" && matches.some(([t]) => t === "HUILE_BOITE")));
  return { type: types.length === 1 ? types[0] : null, ambiguous: types.length > 1 };
}
