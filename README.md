# Pacsun automated checkout using Node.JS

In April 2021, Pacsun released the Fear Of God Essentials collection.
Unfortunately because of site changes in Q3 2022, this code does not function properly.
 
# Fun things I found while exploring Pacsun

Using any other HTTP method than POST on a Akamai Bot Manager protected endpoint will pass thru regardless of having a valid Akamai ("_abck") cookie. See submitDetails()

On some occurance, you would get ghost $8 shipping charges and no item resulting in the website cancelling your order.

# Download the dependencies

`npm install`

# Run

`node index.js`
