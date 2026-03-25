# Datenmodell

## User
Admin/User
MitarbeiterRef
....


## Mitarbeiter
-Ref Nr.
-Name
-Skills (Mühle, Walze, Exktration, Lecithin)
-Weekly Work Req. in h 
-Urlaubs Anspruch
### Relationship
Zuweisung 1:N
Zeitbuchungen 1:N
Urlaubsantrag 1:N
Prämien 1:N


## Zuteilung
-MA Ref. Nr.
-Teilanlage (Mühle, Walze, Extraktion, Lecithin, Springer)

-Datum Einsatz
-Schicht (F Früh, S Spätschicht, N Nachtschicht, Springer Schicht, U Urlaub, Krankmeldung, X-Frei Auf gleitzeit (Überstunden Abbau, Muss Freigegeben werden))

-Erstellt am
-Erstellt von (UserId)

-Unique Constraint (MA Ref. & Datum)

## Zeitbuchung
-MA Ref. Nr.
-Datum
-Von
-Bis
-Schicht

## Prämien
-Mitarbeiter Ref.
-Typ
-Zuteilung

## Zeitplan
-Jahr
-Kalenderwoche 1-52
-Unique Constraint Jahr/KW
### Relation
-Zuweisungen 1:n

## Urlaubsantrag
-Mitarbeiter Ref
-von
-bis
-Genehmingt Von


# Features
-Stundenzettel kann Jeder Mitarbeiter für sich einsehen, für einen Monat, welche Zuweisungen und welche tatsächlich Gestemplete Zeit.

-Zuweisungen können nur admin erstellen, in einer schitplanansicht

-Sichtplan kann jeder Einsehen, PDF Export Möglich

-(Mock) Vorschläge für Zuweisung

-Admin können historische zuweisung für MA einsehen 

-Überstunden Abbau mit freigabe (Out of Scope für showcase)


# Rules
MA dürfen nicht länger als 12 Tage am Stück Arbeit
Pause muss ab 6 Stunden halbe stunde Abziehen
Ab 9std 45min
Klassisches 4 Schicht System wie wahrscheinlich bei Öl & Protein Neuss
2 Tage Frühschicht (z. B. 06:00 - 14:00 Uhr)
2 Tage Spätschicht (z. B. 14:00 - 22:00 Uhr)
2 Tage Nachtschicht (z. B. 22:00 - 06:00 Uhr)
2 Tage Frei
dann beginnt der Zyklus wieder von vorn mit der Frühschicht.
 
Man arbeitet somit pro Schichtplan im Durschnitt 42 Stunden (nicht 40, nicht 38 ec. auch wenn das im Vertrag steht) Die zusätzlichen Stunden werden die "X" Freischichten. Diese können entweder Fest im Jahresplan integriert werden oder werden nach Absprache (mit Genehmigung) genommen. 