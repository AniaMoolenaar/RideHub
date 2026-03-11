5 biggest improvements that would double the chance this app reaches 100k+ users



**Phase 1 — Navigation \& Broken Paths**



Time: ~1 hour



Fix all routing problems in one pass.



Tasks



Fix Home search routes



Remove or wire dead premium buttons



Confirm all navigation paths exist



Check these routes:



/ride-group/\[groupId]

/ride-article/\[articleId]



/learn-group/\[groupId]

/learn-article/\[articleId]



/maintain-group/\[groupId]

/maintain-article/\[articleId]



/premium

/profile

/crash-card



Also verify:



router.push()

router.replace()



all point to real screens.



**Phase 2 — Progress System (Counters + State)**



Time: ~2–3 hours



Do all progress work at once.



Tasks



Fix counters refreshing when returning from article



Use:



useFocusEffect()



Filter locked premium articles from counters



Ensure database table is correct:



user\_article\_state



Columns:



user\_id

article\_id

is\_read

is\_saved

updated\_at



Add constraint:



unique(user\_id, article\_id)



Verify read/save updates UI immediately.



**Phase 3 — Article Experience**



Time: ~3–4 hours



Users spend most time here.



Tasks

Typography pass



Update markdown styles:



paragraph lineHeight: 24

paragraph marginBottom: 10

heading marginTop: 20

heading marginBottom: 8

Card spacing pass



Add:



marginBottom: 20



between cards.



Image fallback



If article image fails:



background placeholder

Reading position restore



Store scroll position:



article\_id

scrollY



Restore when reopening article.



**Phase 4 — Premium System Polish**



Time: ~2 hours



Revenue-critical.



Tasks



Improve lock card messaging.



Example:



Unlock the Ride Pack

Access 40+ riding guides and advanced techniques.



Add value bullets:



• 14 riding topics

• 38 in-depth articles



Add button:



Restore Purchases



Test:



logged out

logged in

premium owner



**Phase 5 — Crash Card Reliability**



Time: ~1–2 hours



Important safety feature.



Tasks



Ensure crash card data works offline.



Cache with:



AsyncStorage



Test airplane mode.



**Phase 6 — Performance Pass**



Time: ~2 hours



Quick wins.



Tasks



Switch images to:



expo-image



Cache:



groups

articles



Prevent double fetches.



Example:



if (dataLoaded) return



**Phase 7 — Visual Polish**



Time: ~1 hour



Small tweaks that improve perceived quality.



Tasks



Normalize tile heights:



180

220

260



Improve pressed animation:



scale: 0.98

opacity: 0.96



Improve hero gradient contrast slightly.



**Phase 8 — Launch Safety**



Time: ~1 hour



Final cleanup.



Tasks



Remove:



console.log



Check Supabase RLS policies:



user\_article\_state



Policy:



user\_id = auth.uid()



Add app version label in profile:



RideHub v1.0

Total Estimated Time

Phase	Time

Navigation fixes	1h

Progress system	3h

Article UX	4h

Premium polish	2h

Crash card reliability	2h

Performance	2h

Visual polish	1h

Launch cleanup	1h



Total: ~16 hours



Which realistically means 2 focused days.

