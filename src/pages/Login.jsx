export default function Login() {
  return (
    <section className="form-container">
      <form action="" method="post" encType="multipart/form-data">
        <h3>login now</h3>
        <p>student number <span>*</span></p>
        <input type="text" name="student-no" placeholder="enter your student number..." required maxLength={50} className="box" />
        <p>password <span>*</span></p>
        <input type="password" name="pass" placeholder="enter your password..." required maxLength={20} className="box" />
        <input type="submit" value="login now" name="submit" className="btn" />
      </form>
    </section>
  )
}
