export default function Update() {
  return (
    <section className="form-container">
      <form action="" method="post" encType="multipart/form-data">
        <h3>update profile</h3>
        <p>update name</p>
        <input type="text" name="name" placeholder="이름" maxLength={50} className="box" />
        <p>student number</p>
        <input type="text" name="student-no" placeholder="학번" maxLength={50} className="box" />
        <p>update email</p>
        <input type="email" name="email" placeholder="이메일" maxLength={50} className="box" />
        <p>previous password</p>
        <input type="password" name="old_pass" placeholder="enter your old password" maxLength={20} className="box" />
        <p>new password</p>
        <input type="password" name="new_pass" placeholder="enter your old password" maxLength={20} className="box" />
        <p>confirm password</p>
        <input type="password" name="c_pass" placeholder="confirm your new password" maxLength={20} className="box" />
        <p>update pic</p>
        <input type="file" accept="image/*" className="box" />
        <input type="submit" value="update profile" name="submit" className="btn" />
      </form>
    </section>
  )
}
