Visual Paradigm import package for Chapter 4

1. UML classes: Project > Import > XMI...; select multimodal_search_uml21.xmi. This is UML 2.1 model data. Create or auto-layout class diagrams after import if your VP version does not reconstruct diagram coordinates.
2. ERD: Tools > DB > Reverse DDL...; select multimodal_search_postgresql.sql, choose PostgreSQL and UTF-8, and enable Generate ERD.
3. The PNG files in ../redrawn_diagrams show the intended layout and can be used for comparison. They are report figures, not editable VP diagrams.
4. Use a new VP project for the first import because importing XMI into an existing project can merge or overwrite matching model elements.
5. SQL is a design schema for the full commerce flow. The supplied prototype implements only search and customer-scoped order lookup.

Official VP guidance:
https://www.visual-paradigm.com/support/documents/vpuserguide/124/221/6864_importingxmi.html
https://circle.visual-paradigm.com/docs/database-design-engineering/database-management-guide/how-to-reverse-engineer-erd-from-ddl/
