# Pacsun automated checkout using Node.JS

In April 2021, Pacsun released the Fear Of God Essentials collection.
Unfortunately because of site changes in Q3 2022, this code does not function properly.
 
# Fun things I found while exploring Pacsun

Product size codes were found based on pattern.

Using any other HTTP method than POST on a Akamai Bot Manager protected endpoint will pass thru regardless of having a valid Akamai ("_abck") cookie. See submitDetails()

On some occurance, you would get $6.24 shipping charges and no item resulting in the website cancelling your order. With better handling in startCheckout() this could be some what solved.

# More information

Around May 14th 2021, the Essentials Fear Of God Buttercream hoodies launched with tons of profits being made.

https://twitter.com/dylanbasss/status/1393239505591840777?s=46&t=-czkTKMO1XxkR9gJ3wJ_9Q

https://twitter.com/dylanbasss/status/1393361676720816132?s=46&t=-czkTKMO1XxkR9gJ3wJ_9Q

https://twitter.com/need4street/status/1393271129284952072?s=46&t=-czkTKMO1XxkR9gJ3wJ_9Q

# Download the dependencies

`npm install`

# Run

`node index.js`
