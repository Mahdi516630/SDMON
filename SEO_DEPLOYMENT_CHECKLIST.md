# SDMON — checklist SEO après déploiement

## Modifications incluses dans cette branche
- Titre et méta-description de la page d'accueil orientés vers les services présentés et la zone de Djibouti.
- H1 plus descriptif, avec le sujet principal et la localisation.
- Balises Open Graph et Twitter harmonisées.
- Favicon SVG autonome ajouté et déclaré dans le HTML.
- Données structurées JSON-LD simplifiées : suppression des prix, horaires et coordonnées géographiques non suffisamment vérifiés, ainsi que du faux fil d'Ariane construit avec des ancres.
- Sitemap XML limité à l'URL canonique réelle de la page d'accueil. Les ancres (#services, #faq, etc.) ne sont pas des pages indexables distinctes.
- robots.txt conserve l'accès public et déclare explicitement le sitemap.

## À faire après mise en production
1. Vérifier que ces URL répondent avec HTTP 200 : https://sdmon.com/ ; https://sdmon.com/robots.txt ; https://sdmon.com/sitemap.xml ; https://sdmon.com/favicon.svg.
2. Dans Google Search Console, vérifier la propriété sdmon.com via DNS ou utiliser le jeton HTML réellement fourni par Search Console. Le jeton présent dans le dépôt ne doit pas être considéré comme valide sans comparaison avec la propriété.
3. Dans Search Console, envoyer https://sdmon.com/sitemap.xml, puis inspecter https://sdmon.com/ et demander une indexation si nécessaire.
4. Vérifier le rendu mobile, les Core Web Vitals, l'absence d'erreurs serveur et l'accessibilité du contenu principal à Googlebot.
5. Vérifier que le numéro WhatsApp, l'adresse e-mail, les horaires, les moyens de paiement et les prix affichés sont exacts et cohérents partout. Ne réintroduire dans le JSON-LD que des informations publiques vérifiées.
6. Ajouter un texte alternatif utile à chaque image informative. Les images purement décoratives doivent avoir alt vide.
7. Créer des pages HTML distinctes avec contenu original si SDMON veut se positionner séparément sur ses offres : développement web, maintenance informatique et diagnostic/réparation PC. Chaque page devra avoir son propre title, sa description, son H1, son URL canonique et des liens internes. Ne pas utiliser les fragments #... comme substituts de pages.
8. Si une version anglaise est publiée, créer de vraies URL anglaises et ajouter des balises hreflang réciproques fr / en et x-default.

## Limites
Le sitemap ne provoque pas une indexation instantanée et les modifications SEO ne garantissent pas une position précise. Google décide du crawl, de l'indexation et du classement. Le déploiement sur l'hébergement et les actions dans Search Console restent nécessaires.
