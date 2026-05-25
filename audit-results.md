# Castilian Spanish Audit — 235 `has_image: false` Entries
## File: `src/lib/data/words-es.ts`
## Date: 2026-05-25

---

## CRITICAL ISSUES

### 🔴 NOT CASTILIAN — Word is Latin American

| # | ID | Word | Issue | Fix |
|---|------|------|-------|-----|
| 1 | es-emotions-010 | **enojado** | Word is Latin American. In Castilian Spanish the word is **enfadado**. Definition also uses 'enojo' (Latin American) instead of 'enfado'. | Change word to **enfadado**; update definition to use 'enfado' instead of 'enojo'; update phonetic first_phonemes from '/eno/' to '/emfa/' or similar; update features.function to use 'enfado'; update synonyms |

### 🔴 NOT CASTILIAN — Definitions/Synonyms Using Latin American Terms

| # | ID | Word | Issue | Fix |
|---|------|------|-------|-----|
| 2 | es-emotions-028 | indignado | Definition uses 'enojo' (Latin American). | Change to '**enfado** y rechazo ante una injusticia' |
| 3 | es-school-033 | bolígrafo | Synonym 'pluma' meaning 'pen' is Latin American usage. In Castilian, 'pluma' = feather/fountain pen. | Remove 'pluma' from synonyms; keep 'boli' |
| 4 | es-vehicles-028 | carretilla elevadora | Synonym 'montacargas' is Latin American. | Replace with '**elevadora**' or remove |
| 5 | es-vehicles-022 | quad | Synonym 'cuatrimoto' is Latin American. | Replace with '**vehículo todo terreno**' (already listed) or remove |
| 6 | es-technology-046 | mando | Synonym 'control remoto' is Latin American. | Remove 'control remoto'; keep 'mando a distancia' |
| 7 | es-emotions-024 | nostálgico | Synonym 'recuerdista' is Latin American informal. | Replace with '**añorante**' or remove |
| 8 | es-emotions-026 | decepcionado | Synonym 'chacoteado' is not standard Castilian. | Replace with '**frustrado**' or remove |
| 9 | es-emotions-023 | ansioso | Synonym 'apezorado' is not a recognized standard Spanish word. | Replace with '**angustiado**' or remove |
| 10 | es-clothing-033 | zapatillas | Synonyms list includes 'tenis' — Latin American for sneakers. Castilian uses 'deportivas'. | Remove 'tenis' from synonyms; keep 'deportivas', 'zapatillas de deporte' |

### 🔴 WRONG DEFINITION — Definition doesn't match the word

| # | ID | Word | Issue | Fix |
|---|------|------|-------|-----|
| 11 | es-family-037 | yerno | Definition says "Esposo de la hija **o del hijo**". Yerno = husband of the daughter only. "Esposo del hijo" would be wrong — that's still a nuera relationship. | Change to "**Esposo de la hija**" |
| 12 | es-family-038 | nuera | Definition says "Esposa del hijo **o de la hija**". Nuera = wife of the son only. | Change to "**Esposa del hijo**" |
| 13 | es-family-027 | padrastro | Definition says "Nuevo esposo del padre **o de la madre**". Padrastro = new husband of the mother. | Change to "**Nuevo esposo de la madre**" |
| 14 | es-family-028 | madrastra | Definition says "Nueva esposa del padre **o de la madre**". Madrastra = new wife of the father. | Change to "**Nueva esposa del padre**" |
| 15 | es-music-038 | campana | Definition says "golpearlo" (masculine pronoun) but campana is feminine. | Change "**golpearlo**" to "**golpearla**" |

### 🔴 WRONG SPELLING

| # | ID | Word | Issue | Fix |
|---|------|------|-------|-----|
| 16 | es-vehicles-035 | kayac | Misspelled. Correct Spanish spelling is 'kayak'. | Change word from **kayac** to **kayak** |

---

## CODE BUGS (Will cause runtime errors)

### 🔴 WRONG FIELD NAME

| # | ID | Word | Issue | Fix |
|---|------|------|-------|-----|
| 17 | es-toys-030 | zancos | Field is named `image_image_url` instead of `image_url`. This is a typo that may cause the image_url field to be undefined. | Change `image_image_url` to `image_url` |

### 🟠 TYPO: `asociations` instead of `associations` (22 entries)
This typo means the `associations` field is **undefined** at runtime for these entries. The misspelled key `asociations` will be silently ignored by TypeScript.

| # | ID | Word |
|---|------|------|
| 18 | es-music-048 | lira |
| 19 | es-places-049 | cementerio |
| 20 | es-places-051 | monumento |
| 21 | es-school-038 | tiza |
| 22 | es-school-039 | rotulador |
| 23 | es-school-040 | pegamento |
| 24 | es-school-042 | colores |
| 25 | es-school-043 | plastilina |
| 26 | es-school-044 | papel |
| 27 | es-school-045 | ábaco |
| 28 | es-school-046 | microscopio |
| 29 | es-school-047 | telescopio |
| 30 | es-school-048 | bandera |
| 31 | es-school-052 | recreo |
| 32 | es-school-053 | examen |
| 33 | es-school-054 | lección |
| 34 | es-school-055 | aula |
| 35 | es-school-056 | pasillo |
| 36 | es-school-057 | comedor |
| 37 | es-school-058 | atlas |
| 38 | es-school-059 | mochila |
| 39 | es-school-060 | pizarra |

**Fix for all 22:** Change `asociations:` to `associations:`

---

## MODERATE ISSUES

### 🟡 ENGLISH WORDS IN SPANISH DATA

| # | ID | Word | Field | Wrong | Fix |
|---|------|------|-------|-------|-----|
| 40 | es-tools-022 | bisagra | synonyms | 'hinge' is English | Remove '**hinge**'; keep 'gozne' |
| 41 | es-clothing-021 | bata | associations | 'protection' is English | Change to '**protección**' |
| 42 | es-music-044 | banjo | associations | 'picked' is English | Remove '**picked**' or replace with 'pulsado' |

### 🟡 INVALID/FAKE RHYMING WORDS

| # | ID | Word | Wrong Value | Fix |
|---|------|------|-------------|-----|
| 43 | es-tools-021 | cadena | 'szedena' (not a word) | Change to '**sedena**' or '**edena**' |
| 44 | es-vehicles-023 | moto de agua | 'totuga' (not a word) | Change to '**tortuga**' |
| 45 | es-vehicles-024 | catamarán | 'willamáng' (not a word) | Change to '**afán**' or '**camarón**' or valid rhyming word |
| 46 | es-weather-029 | anticiclón | 'mosquición' (not a word) | Change to '**ciclon**' or '**guion**' |

### 🟡 TYPOS IN TEXT FIELDS

| # | ID | Word | Field | Issue | Fix |
|---|------|------|-------|-------|-----|
| 47 | es-sports-037 | hockey | features.function | 'se **jueva**' typo | Change to '**se juega**' |
| 48 | es-sports-039 | remo | features.associations | '**canale**' missing 's' | Change to '**canales**' |
| 49 | es-emotions-034 | temeroso | features.properties | '**proteccion**' missing accent | Change to '**protección**' |

---

## MINOR / CULTURAL NOTES

| # | ID | Word | Note |
|---|------|------|------|
| 50 | es-vehicles-030 | autobús escolar | Properties say "Grande, **amarillo**" — yellow school buses are a US convention. In Spain, school buses are typically white/blue. Minor cultural mismatch. |
| 51 | es-tools-023 | candado | Association 'candela' seems unrelated (candela = candle/fire). Possibly intended 'candado'. |
| 52 | es-clothing-033 | zapatillas | Associations list includes 'tenis' — Latin American. Minor since it's just an association, not the main word or definition. |

---

## SUMMARY

- **Total entries audited:** 235
- **Entries with issues:** 52 unique entries (~22%)
- **Critical (NOT CASTILIAN / WRONG WORD):** 1 entry (enojado → enfadado)
- **WRONG DEFINITION:** 5 entries (yerno, nuera, padrastro, madrastra, campana)
- **WRONG SPELLING:** 1 entry (kayac → kayak)
- **CODE BUGS (field name typos):** 23 entries (1 image_image_url + 22 asociations)
- **ENGLISH WORDS IN DATA:** 3 entries (hinge, protection, picked)
- **INVALID RHYMING WORDS:** 4 entries
- **TEXT TYPOS:** 3 entries (jueva→juega, canale→canales, proteccion→protección)
- **LATIN AMERICAN SYNONYMS:** 7 entries
- **MINOR CULTURAL:** 3 entries

### Priority Fixes (in order):
1. **es-toys-030 `zancos`** — `image_image_url` field name bug
2. **22 entries with `asociations`** — field name typo causes data loss
3. **es-emotions-010 `enojado`** — entire word is wrong for Castilian
4. **4 family definitions** — factually incorrect definitions
5. **es-vehicles-035 `kayac`** — spelling error
6. **3 English words** in Spanish-only fields
7. **4 fake rhyming words** — nonsensical values
8. **7 Latin American synonyms** — not suitable for Castilian target audience
