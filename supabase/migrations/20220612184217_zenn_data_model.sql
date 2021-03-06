-- This script was generated by the Schema Diff utility in pgAdmin 4
-- For the circular dependencies, the order in which Schema Diff writes the objects is not very sophisticated
-- and may require manual changes to the script to ensure changes are applied in the correct order.
-- Please report an issue for any failure with the reproduction steps.

ALTER TABLE IF EXISTS public.posts
    ENABLE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS public.posts
    ADD COLUMN belongs_to uuid;
ALTER TABLE IF EXISTS public.posts
    ADD CONSTRAINT posts_belongs_to_fkey FOREIGN KEY (belongs_to)
    REFERENCES public.users (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;

CREATE POLICY "Enable access for users based on user_id"
    ON public.posts
    AS PERMISSIVE
    FOR ALL
    TO public
    USING ((auth.uid() = belongs_to));
